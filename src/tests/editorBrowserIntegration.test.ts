import { constants, accessSync } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer as createNetworkServer } from 'node:net';
import { tmpdir } from 'node:os';
import { delimiter, isAbsolute, join } from 'node:path';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createServer as createViteServer, type ViteDevServer } from 'vite';
import { describe, expect, it } from 'vitest';
import {
  createInitialProgress,
  PROGRESS_SCHEMA_VERSION,
  PROGRESS_STORAGE_KEY,
} from '../lib/progress/progressStore';

interface BrowserLaunch {
  executable: string;
  prefixArguments: string[];
  name: string;
}

interface CdpMessage {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: unknown;
}

class CdpClient {
  private readonly socket: WebSocket;
  private readonly pending = new Map<
    number,
    { resolve: (value: Record<string, unknown>) => void; reject: (reason: unknown) => void }
  >();
  private readonly eventHandlers = new Map<string, Array<(params: Record<string, unknown>) => void>>();
  private nextId = 1;
  readonly exceptions: CdpMessage[] = [];
  readonly failedResponses: Array<{
    status: number;
    statusText: string;
    url: string;
  }> = [];
  readonly requests: string[] = [];
  readonly downloads: Array<{
    method: string;
    params: Record<string, unknown>;
  }> = [];

  private constructor(socket: WebSocket) {
    this.socket = socket;
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data)) as CdpMessage;
      if (message.id !== undefined) {
        const waiter = this.pending.get(message.id);
        if (!waiter) return;
        this.pending.delete(message.id);
        if (message.error) waiter.reject(message.error);
        else waiter.resolve(message.result ?? {});
        return;
      }
      if (message.method === 'Runtime.exceptionThrown') {
        this.exceptions.push(message);
      }
      if (message.method === 'Network.requestWillBeSent') {
        const request = message.params?.request as { url?: string } | undefined;
        if (request?.url) this.requests.push(request.url);
      }
      if (message.method === 'Network.responseReceived') {
        const response = message.params?.response as {
          status?: number;
          statusText?: string;
          url?: string;
        } | undefined;
        if (
          response?.status !== undefined
          && response.status >= 400
          && response.url
        ) {
          this.failedResponses.push({
            status: response.status,
            statusText: response.statusText ?? '',
            url: response.url,
          });
        }
      }
      if (
        message.method === 'Browser.downloadWillBegin'
        || message.method === 'Browser.downloadProgress'
      ) {
        this.downloads.push({
          method: message.method,
          params: message.params ?? {},
        });
      }
      if (!message.method) return;
      const handlers = this.eventHandlers.get(message.method) ?? [];
      this.eventHandlers.delete(message.method);
      handlers.forEach((handler) => handler(message.params ?? {}));
    });
  }

  static async connect(url: string): Promise<CdpClient> {
    const socket = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      socket.addEventListener('open', () => resolve(), { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    return new CdpClient(socket);
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method: string): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
      this.eventHandlers.set(method, [...(this.eventHandlers.get(method) ?? []), resolve]);
    });
  }

  async evaluate<T>(expression: string): Promise<T> {
    const response = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    }) as {
      result?: { value?: T };
      exceptionDetails?: unknown;
    };
    if (response.exceptionDetails) throw response.exceptionDetails;
    return response.result?.value as T;
  }

  close(): void {
    this.socket.close();
  }
}

function executablePath(command: string): string | null {
  const candidates = isAbsolute(command) || command.includes('/')
    ? [command]
    : (process.env.PATH ?? '')
      .split(delimiter)
      .filter(Boolean)
      .map((directory) => join(directory, command));

  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Continúa buscando el ejecutable en PATH.
    }
  }
  return null;
}

function respondsAsBrowser(executable: string): boolean {
  const result = spawnSync(executable, ['--version'], {
    stdio: 'ignore',
    timeout: 5_000,
  });
  return !result.error && result.status === 0;
}

function installedFlatpakBrowser(
  flatpakExecutable: string,
  applicationId: string,
  name: string,
): BrowserLaunch | null {
  const result = spawnSync(flatpakExecutable, ['info', applicationId], {
    stdio: 'ignore',
    timeout: 5_000,
  });
  if (result.error || result.status !== 0) return null;
  return {
    executable: flatpakExecutable,
    prefixArguments: ['run', applicationId],
    name: `${name} (Flatpak)`,
  };
}

function findBrowser(): BrowserLaunch | null {
  const configuredBrowser = process.env.BROWSER_BIN?.trim();
  if (configuredBrowser) {
    const executable = executablePath(configuredBrowser);
    if (executable && respondsAsBrowser(executable)) {
      return {
        executable,
        prefixArguments: [],
        name: `BROWSER_BIN (${configuredBrowser})`,
      };
    }
    console.warn(
      `[editorBrowserIntegration] BROWSER_BIN no apunta a un navegador ejecutable: ${configuredBrowser}. `
      + 'Se buscará otra instalación compatible.',
    );
  }

  const nativeBrowsers = [
    ['brave-browser', 'Brave'],
    ['brave', 'Brave'],
    ['google-chrome-stable', 'Google Chrome'],
    ['google-chrome', 'Google Chrome'],
    ['chromium', 'Chromium'],
    ['chromium-browser', 'Chromium'],
    ['/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', 'Brave'],
    ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'Google Chrome'],
    ['/Applications/Chromium.app/Contents/MacOS/Chromium', 'Chromium'],
  ] as const;

  for (const [command, name] of nativeBrowsers) {
    const executable = executablePath(command);
    if (executable && respondsAsBrowser(executable)) {
      return { executable, prefixArguments: [], name };
    }
  }

  const flatpakExecutable = executablePath('flatpak');
  if (flatpakExecutable) {
    const flatpakBrowsers = [
      ['com.brave.Browser', 'Brave'],
      ['com.google.Chrome', 'Google Chrome'],
      ['org.chromium.Chromium', 'Chromium'],
    ] as const;
    for (const [applicationId, name] of flatpakBrowsers) {
      const browser = installedFlatpakBrowser(flatpakExecutable, applicationId, name);
      if (browser) return browser;
    }
  }

  return null;
}

async function getFreePort(): Promise<number> {
  const server = createNetworkServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('No se pudo reservar un puerto local.');
  }
  const { port } = address;
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitForBrowser(
  port: number,
  browserName: string,
  getProcessFailure: () => Error | null,
): Promise<{ webSocketDebuggerUrl: string }> {
  const deadline = Date.now() + 15_000;
  let lastError: unknown;
  while (Date.now() < deadline) {
    const processFailure = getProcessFailure();
    if (processFailure) throw processFailure;
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) {
        return await response.json() as { webSocketDebuggerUrl: string };
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`${browserName} no abrió DevTools: ${String(lastError)}`);
}

async function stopBrowser(browserProcess: ChildProcess): Promise<void> {
  if (
    browserProcess.pid === undefined
    || browserProcess.exitCode !== null
    || browserProcess.signalCode !== null
  ) return;

  const exited = new Promise<void>((resolve) => {
    browserProcess.once('exit', () => resolve());
  });
  browserProcess.kill('SIGTERM');
  const closedGracefully = await Promise.race([
    exited.then(() => true),
    new Promise<false>((resolve) => setTimeout(() => resolve(false), 3_000)),
  ]);
  if (!closedGracefully && browserProcess.exitCode === null && browserProcess.signalCode === null) {
    browserProcess.kill('SIGKILL');
    await Promise.race([
      exited,
      new Promise<void>((resolve) => setTimeout(resolve, 1_000)),
    ]);
  }
}

async function waitForEditor(client: CdpClient): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (await client.evaluate<boolean>('Boolean(document.querySelector(".cm-editor"))')) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`LatexCodeEditor no montó .cm-editor. Excepciones: ${JSON.stringify(client.exceptions)}`);
}

async function waitForApplication(
  url: string,
  getProcessFailure: () => Error | null,
  getOutput: () => string,
): Promise<void> {
  const deadline = Date.now() + 20_000;
  let lastError: unknown;
  while (Date.now() < deadline) {
    const processFailure = getProcessFailure();
    if (processFailure) throw processFailure;
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`Astro respondió ${response.status} ${response.statusText}.`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(
    `Astro no sirvió ${url}: ${String(lastError)}\n${getOutput()}`,
  );
}

const availableBrowser = findBrowser();

if (!availableBrowser) {
  console.warn(
    '[editorBrowserIntegration] BROWSER TESTS NOT RUN: no se encontró Brave, Google Chrome o Chromium. '
    + 'La validación no cuenta como aprobación browser completa; define BROWSER_BIN para ejecutarlos.',
  );
}

describe('LatexCodeEditor en un DOM de navegador real', () => {
  it('monta CodeMirror, despacha cambios y ejecuta Limpiar, Restaurar y Copiar', async ({ skip }) => {
    const browser = availableBrowser;
    if (!browser) {
      const message = 'No se encontró Brave, Google Chrome o Chromium. Define BROWSER_BIN con la ruta de un navegador compatible.';
      if (process.env.BROWSER_TESTS_REQUIRED === '1') throw new Error(message);
      return skip(message);
    }

    let viteServer: ViteDevServer | null = null;
    let browserProcess: ChildProcess | null = null;
    let client: CdpClient | null = null;
    let browserProcessFailure: Error | null = null;
    let browserReady = false;
    const profileDirectory = await mkdtemp(join(tmpdir(), 'texdock-editor-browser-'));

    try {
      viteServer = await createViteServer({
        root: process.cwd(),
        configFile: false,
        logLevel: 'silent',
        server: {
          host: '127.0.0.1',
          port: 0,
        },
      });
      await viteServer.listen();
      const address = viteServer.httpServer?.address();
      if (!address || typeof address === 'string') {
        throw new Error('Vite no expuso un puerto para el fixture.');
      }

      const debuggerPort = await getFreePort();
      browserProcess = spawn(browser.executable, [
        ...browser.prefixArguments,
        '--headless=new',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--no-first-run',
        '--no-default-browser-check',
        '--remote-debugging-address=127.0.0.1',
        `--remote-debugging-port=${debuggerPort}`,
        `--user-data-dir=${profileDirectory}`,
        'about:blank',
      ], { stdio: 'ignore' });
      browserProcess.once('error', (error) => {
        browserProcessFailure = new Error(
          `No se pudo iniciar ${browser.name}: ${error.message}`,
          { cause: error },
        );
      });
      browserProcess.once('exit', (code, signal) => {
        if (!browserReady) {
          browserProcessFailure = new Error(
            `${browser.name} terminó antes de abrir DevTools `
            + `(código ${String(code)}, señal ${String(signal)}).`,
          );
        }
      });

      await waitForBrowser(
        debuggerPort,
        browser.name,
        () => browserProcessFailure,
      );
      browserReady = true;
      const fixtureUrl = `http://127.0.0.1:${address.port}/src/tests/fixtures/editor-browser.html`;
      const target = await (
        await fetch(
          `http://127.0.0.1:${debuggerPort}/json/new?${encodeURIComponent(fixtureUrl)}`,
          { method: 'PUT' },
        )
      ).json() as { webSocketDebuggerUrl: string };

      client = await CdpClient.connect(target.webSocketDebuggerUrl);
      await client.send('Runtime.enable');
      await client.send('Page.enable');
      await client.send('Browser.grantPermissions', {
        origin: `http://127.0.0.1:${address.port}`,
        permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
      });
      const loaded = client.once('Page.loadEventFired');
      await client.send('Page.navigate', { url: fixtureUrl });
      await loaded;
      await waitForEditor(client);

      expect(await client.evaluate<boolean>('window.editorBrowserTest.hasLoadedMathJax()')).toBe(false);

      const initial = [
        '\\documentclass{article}',
        '\\begin{document}',
        'Código inicial',
        '\\end{document}',
      ].join('\n');
       expect(await client.evaluate<number>('document.querySelectorAll(".cm-editor").length')).toBe(3);
      expect(await client.evaluate<string>('document.querySelector(".cm-content")?.getAttribute("contenteditable")')).toBe('true');
      expect(await client.evaluate<boolean>('window.editorBrowserTest.isReadOnly()')).toBe(false);
       expect(await client.evaluate<string>('window.editorBrowserTest.getCode()')).toBe(initial);

        expect(await client.evaluate<boolean>(`(() => {
          const button = document.querySelector('.preview-project-trigger');
          const popover = document.querySelector('.preview-project-popover');
         return Boolean(button && popover
           && button.getAttribute('aria-expanded') === 'false'
            && popover.hasAttribute('hidden'));
        })()`)).toBe(true);
        await client.evaluate(`(() => {
          const trigger = document.querySelector('.preview-project-trigger');
          trigger?.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
          trigger?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        })()`);
        await new Promise((resolve) => setTimeout(resolve, 150));
        expect(await client.evaluate<string>(
          'document.querySelector(".preview-project-trigger")?.getAttribute("aria-expanded") ?? ""',
        )).toBe('true');
        await client.evaluate(`(() => {
          const trigger = document.querySelector('.preview-project-trigger');
          trigger?.dispatchEvent(new PointerEvent('pointerout', {
            bubbles: true, pointerType: 'mouse', relatedTarget: document.body,
          }));
          trigger?.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }));
        })()`);
        await new Promise((resolve) => setTimeout(resolve, 180));
        expect(await client.evaluate<string>(
          'document.querySelector(".preview-project-trigger")?.getAttribute("aria-expanded") ?? ""',
        )).toBe('false');
        await client.evaluate(`document.querySelector('.preview-project-trigger')?.click()`);
       await new Promise((resolve) => setTimeout(resolve, 50));
        expect(await client.evaluate<{ fixed: boolean; parentIsBody: boolean; visible: boolean; zIndex: string }>(`(() => {
          const button = document.querySelector('.preview-project-trigger');
          const popover = document.querySelector('.preview-project-popover');
          return {
            fixed: popover ? getComputedStyle(popover).position === 'fixed' : false,
            parentIsBody: popover?.parentElement === document.body,
            visible: Boolean(button
              && button.getAttribute('aria-expanded') === 'true'
              && !popover?.hasAttribute('hidden')),
            zIndex: popover ? getComputedStyle(popover).zIndex : '',
          };
        })()`)).toEqual({ fixed: true, parentIsBody: true, visible: true, zIndex: '10' });
       expect(await client.evaluate<boolean>(`(() => {
         const button = document.querySelector('.preview-project-trigger');
         if (!button) return false;
         button.focus();
         button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
         return document.activeElement === button;
       })()`)).toBe(true);
       await new Promise((resolve) => setTimeout(resolve, 50));
       expect(await client.evaluate<string>(
         'document.querySelector(".preview-project-trigger")?.getAttribute("aria-expanded") ?? ""',
       )).toBe('false');
       await client.evaluate(`document.querySelector('.preview-project-trigger')?.click()`);
       await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
       await client.send('Input.dispatchMouseEvent', {
         type: 'mousePressed', x: 5, y: 5, button: 'left', clickCount: 1,
       });
       await client.send('Input.dispatchMouseEvent', {
         type: 'mouseReleased', x: 5, y: 5, button: 'left', clickCount: 1,
       });
       await new Promise((resolve) => setTimeout(resolve, 50));
       await new Promise((resolve) => setTimeout(resolve, 50));
       expect(await client.evaluate<string>(
         'document.querySelector(".preview-project-trigger")?.getAttribute("aria-expanded") ?? ""',
       )).toBe('false');
       expect(await client.evaluate<boolean>(`(() => {
         const button = document.querySelector('.preview-project-trigger');
         const other = document.querySelector('.math-playground h1');
         if (!button || !other) return false;
         button.focus();
         other.tabIndex = -1;
         other.focus();
         return document.activeElement === other;
       })()`)).toBe(true);
       await new Promise((resolve) => setTimeout(resolve, 50));
       expect(await client.evaluate<string>(
         'document.querySelector(".preview-project-trigger")?.getAttribute("aria-expanded") ?? ""',
       )).toBe('false');
       expect(await client.evaluate<boolean>(`(() => {
         const exercise = document.querySelector('#exercise-root');
         return !exercise?.querySelector('.cm-tooltip-autocomplete');
       })()`)).toBe(true);
       await client.send('Emulation.setDeviceMetricsOverride', {
         width: 320,
         height: 740,
         deviceScaleFactor: 1,
         mobile: true,
       });
       await client.evaluate(`document.querySelector('.preview-project-trigger')?.click()`);
       await new Promise((resolve) => setTimeout(resolve, 50));
       expect(await client.evaluate<string>(
         'document.querySelector(".preview-project-trigger")?.getAttribute("aria-expanded") ?? ""',
       )).toBe('true');
       await client.evaluate(`document.querySelector('.preview-project-trigger')?.click()`);
       await client.send('Emulation.setDeviceMetricsOverride', {
         width: 1024,
         height: 800,
         deviceScaleFactor: 1,
         mobile: false,
       });

       const invalidExercise = [
         '\\documentclass{article}',
         '\\begin{document}',
         'Otra respuesta',
         '\\end{document}',
       ].join('\n');
       await client.evaluate(`window.editorBrowserTest.setExerciseCode(${JSON.stringify(invalidExercise)})`);
       await client.evaluate('window.editorBrowserTest.approveExercise()');
       expect(await client.evaluate<string[] | undefined>(
         'window.editorBrowserTest.getProgress()?.completedExerciseIds',
       )).toEqual([]);

       const validExercise = [
         '\\documentclass{article}',
         '\\begin{document}',
         'Respuesta',
         '\\end{document}',
       ].join('\n');
       await client.evaluate(`window.editorBrowserTest.setExerciseCode(${JSON.stringify(validExercise)})`);
       await client.evaluate('window.editorBrowserTest.approveExercise()');
       expect(await client.evaluate<string[]>(
         'window.editorBrowserTest.getProgress()?.completedExerciseIds',
       )).toEqual(['fixture-exercise']);
       expect(await client.evaluate<string[]>(
         'window.editorBrowserTest.getProgress()?.completedLessons',
       )).toContain('l1');
       expect(await client.evaluate<boolean>(
         'document.querySelector("[data-progress-lesson=\\"l2\\"] .subsection-link")?.hasAttribute("href") ?? false',
       )).toBe(true);
        expect(await client.evaluate<string | null>(
          'document.querySelector("[data-progress-lesson=\\"l2\\"] .subsection-link")?.getAttribute("aria-disabled") ?? null',
        )).toBeNull();
        expect(await client.evaluate<string>(
          'document.querySelector("[data-progress-navigation]")?.dataset.progressState ?? ""',
        )).toBe('available');
        expect(await client.evaluate<boolean>(
          'document.querySelector("[data-progress-navigation]")?.classList.contains("nav-link--available") ?? false',
        )).toBe(true);
        await client.evaluate(`window.dispatchEvent(new CustomEvent('texdock:page-visited', { detail: { pageId: 'p2' } }))`);
       expect(await client.evaluate<string[]>(
         'window.editorBrowserTest.getProgress()?.completedLessons',
       )).toContain('l2');
       expect(await client.evaluate<boolean>(
         'document.querySelector("[data-progress-section=\\"s2\\"] [data-progress-section-toggle]")?.disabled ?? true',
       )).toBe(false);
        expect(await client.evaluate<boolean>(
          'document.querySelector("[data-progress-lesson=\\"l3\\"] .subsection-link")?.hasAttribute("href") ?? false',
        )).toBe(true);
        await client.evaluate(`window.dispatchEvent(new CustomEvent('texdock:page-visited', { detail: { pageId: 'p1-next' } }))`);
        expect(await client.evaluate<string>(
          'document.querySelector("[data-progress-navigation]")?.dataset.progressState ?? ""',
        )).toBe('completed');
        expect(await client.evaluate<boolean>(
          'document.querySelector("[data-progress-navigation]")?.classList.contains("nav-link--completed") ?? false',
        )).toBe(true);

       const reloaded = client.once('Page.loadEventFired');
       await client.send('Page.reload');
       await reloaded;
       await waitForEditor(client);
       expect(await client.evaluate<string[]>(
         'window.editorBrowserTest.getProgress()?.completedExerciseIds',
       )).toEqual(['fixture-exercise']);
       expect(await client.evaluate<string>(
         'localStorage.getItem("texdock:progress") ? "present" : "missing"',
       )).toBe('present');

       await client.evaluate('window.editorBrowserTest.resetProgress()');
       expect(await client.evaluate<string>(
         'localStorage.getItem("texdock:progress") === null ? "missing" : "present"',
       )).toBe('missing');
        expect(await client.evaluate<string[]>(
          'window.editorBrowserTest.getProgress()?.completedExerciseIds',
        )).toEqual([]);
        expect(await client.evaluate<string>(
          'document.querySelector("[data-progress-navigation]")?.dataset.progressState ?? ""',
        )).toBe('blocked');
       expect(await client.evaluate<boolean>(`(() => {
         const section = document.querySelector('[data-progress-section="s2"]');
         const toggle = section?.querySelector('[data-progress-section-toggle]');
         const lesson = document.querySelector('[data-progress-lesson="l2"] .subsection-link');
         if (!(toggle instanceof HTMLButtonElement) || !(lesson instanceof HTMLAnchorElement)) return false;
         toggle.click();
         toggle.focus();
         return toggle.disabled
           && toggle.getAttribute('aria-expanded') === 'false'
           && document.activeElement !== toggle
           && !lesson.hasAttribute('href')
           && lesson.tabIndex === -1
           && lesson.getAttribute('aria-disabled') === 'true';
       })()`)).toBe(true);
       expect(await client.evaluate<boolean>(
         'document.querySelector("[data-progress-navigation]")?.hasAttribute("href") ?? false',
       )).toBe(false);
       expect(await client.evaluate<boolean>(
         `!document.getElementById('progress-root')?.textContent?.match(/Bloqueada|En progreso|Disponible|Completada/)`,
       )).toBe(true);
       expect(await client.evaluate<{ completedPageIds: string[]; redirect: string }>(
         'window.editorBrowserTest.testLockedRoute()',
       )).toEqual({ completedPageIds: [], redirect: '/TexDock/aprender/' });

      const linePoint = await client.evaluate<{ x: number; y: number }>(`(() => {
        const line = [...document.querySelectorAll('.cm-line')]
          .find((candidate) => candidate.textContent === 'Código inicial');
        if (!line) throw new Error('No se encontró la línea editable.');
        const rect = line.getBoundingClientRect();
        return { x: rect.right - 2, y: rect.top + rect.height / 2 };
      })()`);
      await client.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: linePoint.x,
        y: linePoint.y,
        button: 'left',
        clickCount: 1,
      });
      await client.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: linePoint.x,
        y: linePoint.y,
        button: 'left',
        clickCount: 1,
      });
      expect(await client.evaluate<string>('document.activeElement?.className')).toContain('cm-content');
      await client.send('Input.insertText', { text: ' escrito con teclado' });
      const typedByUser = initial.replace('Código inicial', 'Código inicial escrito con teclado');
      expect(await client.evaluate<string>('window.editorBrowserTest.getCode()')).toBe(typedByUser);
      expect(await client.evaluate<string>('window.editorBrowserTest.changes.at(-1)')).toBe(typedByUser);

      const written = initial.replace('Código inicial', 'Código escrito por dispatch');
      await client.evaluate(`window.editorBrowserTest.dispatchCode(${JSON.stringify(written)})`);
      expect(await client.evaluate<string>('window.editorBrowserTest.getCode()')).toBe(written);
      expect(await client.evaluate<string>('window.editorBrowserTest.changes.at(-1)')).toBe(written);

      const erased = written.replace(' por dispatch', '');
      await client.evaluate(`window.editorBrowserTest.dispatchCode(${JSON.stringify(erased)})`);
      expect(await client.evaluate<string>('window.editorBrowserTest.getCode()')).toBe(erased);
      expect(await client.evaluate<string>('window.editorBrowserTest.changes.at(-1)')).toBe(erased);

      await client.evaluate(`([...document.querySelectorAll('button')].find((button) => button.textContent === 'Limpiar')).click()`);
      expect(await client.evaluate<string>('window.editorBrowserTest.getCode()')).toBe('');
      expect(await client.evaluate<string>('window.editorBrowserTest.changes.at(-1)')).toBe('');

      await client.evaluate(`([...document.querySelectorAll('button')].find((button) => button.textContent === 'Restaurar')).click()`);
      expect(await client.evaluate<string>('window.editorBrowserTest.getCode()')).toBe(initial);
      expect(await client.evaluate<string>('window.editorBrowserTest.changes.at(-1)')).toBe(initial);

      await client.evaluate(`([...document.querySelectorAll('button')].find((button) => button.textContent === 'Copiar')).click()`);
      const copyDeadline = Date.now() + 2_000;
      let copyMessage = '';
      while (Date.now() < copyDeadline && !copyMessage) {
        copyMessage = await client.evaluate<string>('document.querySelector(".latex-editor-wrapper .sr-only")?.textContent ?? ""');
        if (!copyMessage) await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(copyMessage).toBe('Código copiado');

      const svgExpressions = [
        '\\frac{a}{b}',
        '\\int_0^1 x^2\\,dx',
        '\\sum_{k=1}^{n} k',
        '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
        'f(x)=\\begin{cases}x^2 & x \\geq 0 \\\\ 0 & x < 0\\end{cases}',
      ];
      for (const expression of svgExpressions) {
        const svg = await client.evaluate<string>(
          `window.editorBrowserTest.createSvg(${JSON.stringify(expression)})`,
        );
        expect(svg, expression).toMatch(/^<svg\b/);
        expect(svg, expression).toContain('xmlns="http://www.w3.org/2000/svg"');
        expect(svg, expression).toMatch(/\bviewBox="[^"]+"/);
        expect(svg, expression).toContain('<defs>');
        expect(svg, expression).toContain('<path');
        expect(svg, expression).toContain('fill="black"');
        expect(svg, expression).not.toMatch(/<(?:script|foreignObject|iframe|object|embed|image|link|a)\b/i);
        expect(svg, expression).not.toMatch(/\son[a-z]+\s*=/i);
        expect(svg, expression).not.toMatch(/(?:href|src)=["']https?:/i);
        expect(svg, expression).not.toMatch(/(?:@font-face|font-family|url\s*\()/i);
        expect(svg, expression).not.toMatch(/<style\b|\sstyle=/i);
        expect(svg, expression).not.toContain('data-background');
      }
      expect(await client.evaluate<boolean>('window.editorBrowserTest.hasLoadedMathJax()')).toBe(true);

      await expect(client.evaluate<string>(
        `window.editorBrowserTest.createSvg(${JSON.stringify('\\href{https://example.com}{x}')})`,
      )).rejects.toBeTruthy();
      await expect(client.evaluate<string>(
        `window.editorBrowserTest.createSvg(${JSON.stringify('\\frac{')})`,
      )).rejects.toBeTruthy();

      const formulaButton = (label: string) => (
        `[...document.querySelectorAll('#formula-root button')]`
        + `.find((button) => button.textContent === ${JSON.stringify(label)})`
      );
      const formulaStatus = 'document.querySelector("#formula-root .status-message")?.textContent?.trim() ?? ""';
      const waitForFormulaStatus = async (expected: string): Promise<string> => {
        const deadline = Date.now() + 4_000;
        let status = '';
        while (Date.now() < deadline) {
          status = await client!.evaluate<string>(formulaStatus);
          if (status.includes(expected)) return status;
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        throw new Error(`No apareció el estado "${expected}". Último estado: "${status}"`);
      };

      expect(await client.evaluate<boolean>(`${formulaButton('Descargar SVG')}.disabled`)).toBe(false);
      expect(await client.evaluate<boolean>(`${formulaButton('Descargar PNG')}.disabled`)).toBe(false);
       expect(await client.evaluate<number>(
         'document.querySelectorAll("#formula-root .status-message[aria-live]").length',
       )).toBe(1);
       await client.evaluate('window.editorBrowserTest.dispatchFormula("")');
       await waitForFormulaStatus('Escribe una expresión LaTeX');
       await client.evaluate(`document.querySelector('.math-playground .cm-content')?.focus()`);
       await client.send('Input.insertText', { text: '\\fr' });
       const completionDeadline = Date.now() + 2_000;
       let completionText = '';
       while (Date.now() < completionDeadline && !completionText.includes('\\frac')) {
         completionText = await client.evaluate<string>(
           'document.querySelector(".math-playground .cm-tooltip-autocomplete")?.textContent ?? ""',
         );
         if (!completionText.includes('\\frac')) await new Promise((resolve) => setTimeout(resolve, 25));
       }
       expect(completionText).toContain('\\frac');
       const completionState = await client.evaluate<{ active: string; focus: string; selected: string }>(`(() => ({
         active: document.querySelector('.math-playground .cm-tooltip-autocomplete')?.textContent ?? '',
         focus: document.activeElement?.className ?? '',
         selected: document.querySelector('.math-playground .cm-tooltip-autocomplete [role="option"][aria-selected="true"]')?.textContent ?? '',
       }))()`);
       expect(completionState).toEqual({ active: '\\fracfracción', focus: 'cm-content cm-lineWrapping', selected: '\\fracfracción' });
       await client.evaluate(`document.querySelector('.math-playground .cm-content')?.focus()`);
       await client.send('Input.dispatchKeyEvent', {
         type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13,
       });
       await client.send('Input.dispatchKeyEvent', {
         type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13,
       });
       expect(await client.evaluate<string>('window.editorBrowserTest.getFormulaCode()')).toBe('\\frac');
       await client.evaluate('window.editorBrowserTest.dispatchFormula("")');
       await new Promise((resolve) => setTimeout(resolve, 50));
       await client.evaluate(`document.querySelector('.math-playground .cm-content')?.focus()`);
       await client.send('Input.insertText', { text: '\\be' });
       const environmentDeadline = Date.now() + 2_000;
       let environmentMenu = '';
       while (Date.now() < environmentDeadline && !environmentMenu.includes('cases')) {
         environmentMenu = await client.evaluate<string>(
           'document.querySelector(".math-playground .cm-tooltip-autocomplete")?.textContent ?? ""',
         );
         if (!environmentMenu.includes('cases')) await new Promise((resolve) => setTimeout(resolve, 25));
       }
       const environmentDebug = await client.evaluate<{ code: string; menu: string; focus: string }>(`(() => ({
         code: window.editorBrowserTest.getFormulaCode(),
         menu: document.querySelector('.math-playground .cm-tooltip-autocomplete')?.textContent ?? '',
         focus: document.activeElement?.className ?? '',
       }))()`);
       expect(environmentDebug).toEqual({ code: '\\be', menu: environmentMenu, focus: 'cm-content cm-lineWrapping' });
       expect(environmentMenu).toContain('cases');
       const completionVisualState = await client.evaluate<{
         detailColor: string;
         detailFontFamily: string;
         detailFontStyle: string;
         iconDisplay: string;
         iconWidth: number;
         labelColor: string;
         labelFontFamily: string;
         labelLeft: number;
         menuBackground: string;
         rootOverflow: boolean;
         selectedBackground: string;
         selectedBorderColor: string;
         selectedBorderWidth: string;
       }>(`(() => {
         const menu = document.querySelector('.math-playground .cm-tooltip-autocomplete');
         const selected = menu?.querySelector('[role="option"][aria-selected="true"]');
         const icon = selected?.querySelector('.cm-completionIcon');
         const label = selected?.querySelector('.cm-completionLabel');
         const detail = selected?.querySelector('.cm-completionDetail');
         const selectedStyle = selected ? getComputedStyle(selected) : null;
         const iconRect = icon?.getBoundingClientRect();
         return {
           detailColor: detail ? getComputedStyle(detail).color : '',
           detailFontFamily: detail ? getComputedStyle(detail).fontFamily : '',
           detailFontStyle: detail ? getComputedStyle(detail).fontStyle : '',
           iconDisplay: icon ? getComputedStyle(icon).display : '',
           iconWidth: iconRect?.width ?? -1,
           labelColor: label ? getComputedStyle(label).color : '',
           labelFontFamily: label ? getComputedStyle(label).fontFamily : '',
           labelLeft: label?.getBoundingClientRect().left ?? -1,
           menuBackground: menu ? getComputedStyle(menu).backgroundColor : '',
           rootOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
           selectedBackground: selectedStyle?.backgroundColor ?? '',
           selectedBorderColor: selectedStyle?.borderLeftColor ?? '',
           selectedBorderWidth: selectedStyle?.borderLeftWidth ?? '',
         };
       })()`);
       expect(completionVisualState.iconDisplay).toBe('none');
       expect(completionVisualState.iconWidth).toBe(0);
       expect(completionVisualState.labelFontFamily).toMatch(/monospace/i);
       expect(completionVisualState.detailFontFamily).not.toMatch(/monospace/i);
       expect(completionVisualState.detailFontStyle).toBe('normal');
       expect(completionVisualState.labelColor).not.toBe(completionVisualState.detailColor);
       expect(completionVisualState.selectedBackground).not.toBe('rgb(3, 105, 161)');
       expect(completionVisualState.selectedBorderWidth).toBe('2px');
       expect(completionVisualState.selectedBorderColor).not.toBe('rgba(0, 0, 0, 0)');
       expect(completionVisualState.menuBackground).not.toBe('rgba(0, 0, 0, 0)');
       expect(completionVisualState.rootOverflow).toBe(true);
       expect(completionVisualState.labelLeft).toBeGreaterThan(0);
       const darkSelectedBackground = completionVisualState.selectedBackground;
       await client.evaluate(`document.documentElement.dataset.theme = 'light'`);
       await new Promise((resolve) => setTimeout(resolve, 50));
       const lightSelectedBackground = await client.evaluate<string>(
         'getComputedStyle(document.querySelector(\'.math-playground .cm-tooltip-autocomplete [aria-selected="true"]\')).backgroundColor',
       );
       expect(lightSelectedBackground).not.toBe(darkSelectedBackground);
       await client.evaluate(`document.documentElement.dataset.theme = 'dark'`);
       const menuState = await client.evaluate<{ menuOverflow: string; scrollbarWidth: string; ulOverflow: string }>(`(() => {
         const menu = document.querySelector('.math-playground .cm-tooltip-autocomplete');
         const list = menu?.querySelector('ul');
         return {
           menuOverflow: menu ? getComputedStyle(menu).overflow : '',
           ulOverflow: list ? getComputedStyle(list).overflow : '',
           scrollbarWidth: list ? getComputedStyle(list).scrollbarWidth : '',
         };
        })()`);
        expect(menuState).toEqual({ menuOverflow: 'hidden', ulOverflow: 'hidden', scrollbarWidth: 'none' });
        await client.evaluate(`document.querySelector('.math-playground .cm-content')?.dispatchEvent(
         new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true, cancelable: true }),
       )`);
       const arrowState = await client.evaluate<{ code: string; selected: string; visible: boolean }>(`(() => {
         const menu = document.querySelector('.math-playground .cm-tooltip-autocomplete');
         const option = menu?.querySelector('[role="option"][aria-selected="true"]');
         const menuRect = menu?.getBoundingClientRect();
         const optionRect = option?.getBoundingClientRect();
         return {
           code: window.editorBrowserTest.getFormulaCode(),
           selected: option?.textContent ?? '',
           visible: Boolean(menuRect && optionRect
             && optionRect.top >= menuRect.top
             && optionRect.bottom <= menuRect.bottom),
         };
       })()`);
       expect(arrowState.code).toBe('\\be');
       expect(arrowState.selected).toContain('begin');
       expect(arrowState.visible).toBe(true);
       await client.evaluate(`(() => {
         const option = [...document.querySelectorAll('.math-playground .cm-tooltip-autocomplete [role="option"]')]
           .find((candidate) => candidate.textContent?.includes('\\\\begin{cases}'));
         if (!(option instanceof HTMLElement)) throw new Error('No se encontró la sugerencia de cases.');
         option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
         option.click();
       })()`);
       await new Promise((resolve) => setTimeout(resolve, 50));
       const casesCode = await client.evaluate<string>('window.editorBrowserTest.getFormulaCode()');
       const casesSelection = await client.evaluate<{ from: number; to: number }>(
         'window.editorBrowserTest.getFormulaSelection()',
       );
       expect(casesCode).toBe('\\begin{cases}\n  \n\\end{cases}');
       expect(casesSelection.from).toBe(casesSelection.to);
       expect(casesSelection.from).toBeGreaterThan('\\begin{cases}\n'.length);
       expect(casesSelection.from).toBeLessThan(casesCode.indexOf('\\end{cases}'));

         await client.evaluate(`window.editorBrowserTest.setFormulaState('\\n\\\\end{cases}', 0)`);
       await client.evaluate(`document.querySelector('.math-playground .cm-content')?.focus()`);
       await client.send('Input.insertText', { text: '\\be' });
       const duplicateDeadline = Date.now() + 2_000;
       while (Date.now() < duplicateDeadline) {
         const text = await client.evaluate<string>(
           'document.querySelector(".math-playground .cm-tooltip-autocomplete")?.textContent ?? ""',
         );
         if (text.includes('cases')) break;
         await new Promise((resolve) => setTimeout(resolve, 25));
       }
       await client.evaluate(`(() => {
         const option = [...document.querySelectorAll('.math-playground .cm-tooltip-autocomplete [role="option"]')]
           .find((candidate) => candidate.textContent?.includes('\\\\begin{cases}'));
         if (!(option instanceof HTMLElement)) throw new Error('No se encontró cases para el cierre existente.');
         option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
         option.click();
       })()`);
       await new Promise((resolve) => setTimeout(resolve, 50));
       expect(await client.evaluate<string>('window.editorBrowserTest.getFormulaCode()')).toBe('\\begin{cases}\n  \n\\end{cases}');

        await client.evaluate(`window.editorBrowserTest.setFormulaState('a', 1)`);
        await client.evaluate(`document.querySelector('.math-playground .cm-content')?.focus()`);
        await client.send('Input.dispatchKeyEvent', {
         type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9,
       });
       await client.send('Input.dispatchKeyEvent', {
         type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9,
       });
       expect(await client.evaluate<string>('window.editorBrowserTest.getFormulaCode()')).toBe('  a');
       expect(await client.evaluate<string>('document.activeElement?.className')).toContain('cm-content');
       await client.evaluate(`window.editorBrowserTest.setFormulaState('  a', 3)`);
       await client.send('Input.dispatchKeyEvent', {
         type: 'keyDown', modifiers: 8, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9,
       });
       await client.send('Input.dispatchKeyEvent', {
         type: 'keyUp', modifiers: 8, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9,
        });
        expect(await client.evaluate<string>('window.editorBrowserTest.getFormulaCode()')).toBe('a');
        await client.evaluate(`window.editorBrowserTest.setFormulaState(${JSON.stringify('\\be')}, 3); document.querySelector('.math-playground .cm-content')?.focus()`);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await client.send('Input.dispatchKeyEvent', {
          type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
        });
        await client.send('Input.dispatchKeyEvent', {
          type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
        });
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(await client.evaluate<boolean>(
          'Boolean(document.querySelector(".math-playground .cm-tooltip-autocomplete"))',
        )).toBe(false);
        await client.evaluate('window.editorBrowserTest.dispatchFormula("")');
       expect(await client.evaluate<boolean>(`${formulaButton('Descargar SVG')}.disabled`)).toBe(true);
      expect(await client.evaluate<boolean>(`${formulaButton('Descargar PNG')}.disabled`)).toBe(true);

      await client.evaluate(`window.editorBrowserTest.dispatchFormula(${JSON.stringify('\\frac{')})`);
      await waitForFormulaStatus('KaTeX no puede procesar');
      expect(await client.evaluate<boolean>(`${formulaButton('Descargar SVG')}.disabled`)).toBe(true);
      expect(await client.evaluate<boolean>(`${formulaButton('Descargar PNG')}.disabled`)).toBe(true);

      const currentFormula = '\\frac{x+1}{y-1}';
      await client.evaluate(
        `window.editorBrowserTest.dispatchFormula(${JSON.stringify(currentFormula)})`,
      );
      await waitForFormulaStatus('Expresión válida');
      expect(await client.evaluate<boolean>(`${formulaButton('Descargar SVG')}.disabled`)).toBe(false);
      expect(await client.evaluate<boolean>(`${formulaButton('Descargar PNG')}.disabled`)).toBe(false);

      await client.evaluate(`${formulaButton('Copiar LaTeX')}.click()`);
      await waitForFormulaStatus('LaTeX copiado');
      expect(await client.evaluate<string>('navigator.clipboard.readText()')).toBe(currentFormula);

      await client.evaluate(`(() => {
        const originalCreateObjectURL = URL.createObjectURL.bind(URL);
        const originalRevokeObjectURL = URL.revokeObjectURL.bind(URL);
        const originalAnchorClick = HTMLAnchorElement.prototype.click;
        window.__formulaPngState = {
          clicked: 0,
          created: 0,
          disabledDuringGeneration: false,
          downloadName: '',
          mime: '',
          pngBytes: [],
          revoked: [],
          statusChanges: [],
        };
        const state = window.__formulaPngState;
        URL.createObjectURL = (blob) => {
          if (blob.type !== 'image/png') return originalCreateObjectURL(blob);
          state.created += 1;
          state.mime = blob.type;
          blob.arrayBuffer().then((buffer) => {
            state.pngBytes = [...new Uint8Array(buffer).slice(0, 8)];
          });
          return 'blob:png-download-test';
        };
        URL.revokeObjectURL = (url) => {
          if (url === 'blob:png-download-test') state.revoked.push(url);
          else originalRevokeObjectURL(url);
        };
        HTMLAnchorElement.prototype.click = function () {
          if (this.download === 'formula-texdock.png') {
            state.clicked += 1;
            state.downloadName = this.download;
            return;
          }
          originalAnchorClick.call(this);
        };
        new MutationObserver(() => {
          const message = document.querySelector(
            '#formula-root .status-message',
          )?.textContent?.trim() ?? '';
          state.statusChanges.push(message);
          if (message === 'Generando PNG…') {
            const exportButtons = [...document.querySelectorAll(
              '#formula-root .formula-action-btn--primary',
            )];
            state.disabledDuringGeneration = exportButtons.length === 2
              && exportButtons.every((button) => button.disabled);
          }
        }).observe(document.querySelector('#formula-root .status-message'), {
          childList: true,
          characterData: true,
          subtree: true,
        });
        window.__restoreFormulaPngMocks = () => {
          URL.createObjectURL = originalCreateObjectURL;
          URL.revokeObjectURL = originalRevokeObjectURL;
          HTMLAnchorElement.prototype.click = originalAnchorClick;
        };
      })()`);
      await client.evaluate(`${formulaButton('Descargar PNG')}.click()`);
      await waitForFormulaStatus('PNG descargado');
      const pngBytesDeadline = Date.now() + 2_000;
      while (
        Date.now() < pngBytesDeadline
        && await client.evaluate<number>(
          'window.__formulaPngState.pngBytes.length',
        ) < 8
      ) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      const pngState = await client.evaluate<{
        clicked: number;
        created: number;
        disabledDuringGeneration: boolean;
        downloadName: string;
        mime: string;
        pngBytes: number[];
        revoked: string[];
        statusChanges: string[];
      }>('window.__formulaPngState');
      expect(pngState.created).toBe(1);
      expect(pngState.clicked).toBe(1);
      expect(pngState.downloadName).toBe('formula-texdock.png');
      expect(pngState.mime).toBe('image/png');
      expect(pngState.pngBytes).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
      expect(pngState.revoked).toEqual(['blob:png-download-test']);
      expect(pngState.statusChanges).toContain('Generando PNG…');
      expect(pngState.disabledDuringGeneration).toBe(true);
      expect(await client.evaluate<boolean>(
        'Boolean(document.querySelector(\'#formula-root a[download="formula-texdock.png"]\'))',
      )).toBe(false);
      expect(await client.evaluate<boolean>(`${formulaButton('Descargar SVG')}.disabled`)).toBe(false);
      expect(await client.evaluate<boolean>(`${formulaButton('Descargar PNG')}.disabled`)).toBe(false);
      await client.evaluate('window.__restoreFormulaPngMocks()');

      await client.evaluate(`(() => {
        window.__originalCanvasToBlob = HTMLCanvasElement.prototype.toBlob;
        HTMLCanvasElement.prototype.toBlob = function (callback) {
          callback(null);
        };
      })()`);
      await client.evaluate(`${formulaButton('Descargar PNG')}.click()`);
      await waitForFormulaStatus('No se pudo generar el PNG');
      expect(await client.evaluate<boolean>(`${formulaButton('Descargar PNG')}.disabled`)).toBe(false);
      await client.evaluate(
        'HTMLCanvasElement.prototype.toBlob = window.__originalCanvasToBlob',
      );

      await client.evaluate(`(() => {
        window.__formulaDownloadState = {
          clicked: 0,
          created: 0,
          revoked: [],
          statusChanges: [],
          svg: '',
        };
        const state = window.__formulaDownloadState;
        URL.createObjectURL = (blob) => {
          state.created += 1;
          blob.text().then((svg) => { state.svg = svg; });
          return 'blob:formula-test';
        };
        URL.revokeObjectURL = (url) => state.revoked.push(url);
        HTMLAnchorElement.prototype.click = function () { state.clicked += 1; };
        new MutationObserver(() => {
          state.statusChanges.push(
            document.querySelector('#formula-root .status-message')?.textContent?.trim() ?? '',
          );
        }).observe(document.querySelector('#formula-root .status-message'), {
          childList: true,
          characterData: true,
          subtree: true,
        });
      })()`);
      await client.evaluate(`${formulaButton('Descargar SVG')}.click()`);
      await waitForFormulaStatus('SVG descargado');
      const downloadState = await client.evaluate<{
        clicked: number;
        created: number;
        revoked: string[];
        statusChanges: string[];
        svg: string;
      }>('window.__formulaDownloadState');
      expect(downloadState.created).toBe(1);
      expect(downloadState.clicked).toBe(1);
      expect(downloadState.revoked).toEqual(['blob:formula-test']);
      expect(downloadState.statusChanges).toContain('Generando SVG…');
      expect(downloadState.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(downloadState.svg).not.toMatch(/<style\b|\sstyle=/i);
      expect(await client.evaluate<boolean>(
        'Boolean(document.querySelector(\'#formula-root a[download="formula-texdock.svg"]\'))',
      )).toBe(false);

      await client.evaluate(
        `window.editorBrowserTest.dispatchFormula(${JSON.stringify('\\href{https://example.com}{x}')})`,
      );
      await waitForFormulaStatus('Expresión válida');
      await client.evaluate(`${formulaButton('Descargar SVG')}.click()`);
      await waitForFormulaStatus('comando no permitido');
      expect(await client.evaluate<boolean>(`${formulaButton('Descargar SVG')}.disabled`)).toBe(false);

      await client.evaluate(`(() => {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: async () => { throw new Error('Fallo simulado'); } },
        });
        document.execCommand = () => false;
        ${formulaButton('Copiar LaTeX')}.click();
      })()`);
      await waitForFormulaStatus('No se pudo copiar la fórmula');
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: 360,
        height: 740,
        deviceScaleFactor: 1,
        mobile: true,
      });
      expect(await client.evaluate<boolean>(
        'document.documentElement.scrollWidth <= window.innerWidth',
      )).toBe(true);
      expect(client.exceptions).toEqual([]);

    } finally {
      if (client) {
        try {
          await client.send('Browser.close');
        } catch {
          // El cierre forzado del proceso se realiza a continuación.
        } finally {
          client.close();
        }
      }
      const shutdownResults = await Promise.allSettled([
        browserProcess ? stopBrowser(browserProcess) : Promise.resolve(),
        viteServer ? viteServer.close() : Promise.resolve(),
      ]);
      const profileCleanupResults = await Promise.allSettled([
        rm(profileDirectory, {
          recursive: true,
          force: true,
          maxRetries: 10,
          retryDelay: 100,
        }),
      ]);
      const cleanupFailure = [...shutdownResults, ...profileCleanupResults].find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );
      if (cleanupFailure) throw cleanupFailure.reason;
    }
  }, 30_000);

  it('reanuda el curso desde el CTA de portada y aprendizaje y aplica fallback seguro', async ({ skip }) => {
    const browser = availableBrowser;
    if (!browser) {
      const message = 'No se encontró Brave, Google Chrome o Chromium. Define BROWSER_BIN con la ruta de un navegador compatible.';
      if (process.env.BROWSER_TESTS_REQUIRED === '1') throw new Error(message);
      return skip(message);
    }

    let astroProcess: ChildProcess | null = null;
    let buildProcess: ChildProcess | null = null;
    let browserProcess: ChildProcess | null = null;
    let client: CdpClient | null = null;
    let astroProcessFailure: Error | null = null;
    let browserProcessFailure: Error | null = null;
    let astroReady = false;
    let browserReady = false;
    let astroOutput = '';
    let buildOutput = '';
    const profileDirectory = await mkdtemp(join(tmpdir(), 'texdock-astro-resume-'));
    const rootUrl = 'http://127.0.0.1';
    const basePath = '/TexDock';
    const resumePath = '/aprender/seccion-01/01-01/la-idea-principal/';

    try {
      const applicationPort = await getFreePort();
      const applicationOrigin = `${rootUrl}:${applicationPort}`;
      const applicationUrl = `${applicationOrigin}${basePath}/`;
      const astroExecutable = join(
        process.cwd(),
        'node_modules',
        'astro',
        'bin',
        'astro.mjs',
      );
      const astroEnvironment = Object.fromEntries(
        Object.entries(process.env).filter(([name]) => !name.startsWith('VITEST')),
      );
      buildProcess = spawn(process.execPath, [
        '--input-type=module',
        '-e',
        "process.argv = ['node', 'astro', 'build']; const { build } = await import('astro'); await build({ root: process.cwd() });",
      ], {
        env: {
          ...astroEnvironment,
          NODE_ENV: 'production',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      buildProcess.stdout?.on('data', (chunk) => {
        buildOutput += String(chunk);
      });
      buildProcess.stderr?.on('data', (chunk) => {
        buildOutput += String(chunk);
      });
      await new Promise<void>((resolve, reject) => {
        buildProcess?.once('error', reject);
        buildProcess?.once('exit', (code, signal) => {
          if (code === 0) resolve();
          else reject(new Error(`Astro build terminó con código ${String(code)} y señal ${String(signal)}.\n${buildOutput}`));
        });
      });
      astroProcess = spawn(process.execPath, [
        astroExecutable,
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        String(applicationPort),
      ], {
        env: {
          ...astroEnvironment,
          NODE_ENV: 'development',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      astroProcess.stdout?.on('data', (chunk) => {
        astroOutput += String(chunk);
      });
      astroProcess.stderr?.on('data', (chunk) => {
        astroOutput += String(chunk);
      });
      astroProcess.once('error', (error) => {
        astroProcessFailure = new Error(`No se pudo iniciar Astro: ${error.message}`, { cause: error });
      });
      astroProcess.once('exit', (code, signal) => {
        if (!astroReady) {
          astroProcessFailure = new Error(
            `Astro terminó antes de servir la página (código ${String(code)}, señal ${String(signal)}).\n${astroOutput}`,
          );
        }
      });
      await waitForApplication(applicationUrl, () => astroProcessFailure, () => astroOutput);
      astroReady = true;

      const debuggerPort = await getFreePort();
      browserProcess = spawn(browser.executable, [
        ...browser.prefixArguments,
        '--headless=new',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--no-first-run',
        '--no-default-browser-check',
        '--remote-debugging-address=127.0.0.1',
        `--remote-debugging-port=${debuggerPort}`,
        `--user-data-dir=${profileDirectory}`,
        'about:blank',
      ], { stdio: 'ignore' });
      browserProcess.once('error', (error) => {
        browserProcessFailure = new Error(`No se pudo iniciar ${browser.name}: ${error.message}`, { cause: error });
      });
      browserProcess.once('exit', (code, signal) => {
        if (!browserReady) {
          browserProcessFailure = new Error(
            `${browser.name} terminó antes de abrir DevTools (código ${String(code)}, señal ${String(signal)}).`,
          );
        }
      });
      const browserVersion = await waitForBrowser(
        debuggerPort,
        browser.name,
        () => browserProcessFailure,
      );
      browserReady = true;
      const target = await (
        await fetch(
          `http://127.0.0.1:${debuggerPort}/json/new?${encodeURIComponent(applicationUrl)}`,
          { method: 'PUT' },
        )
      ).json() as { webSocketDebuggerUrl: string };
      expect(browserVersion.webSocketDebuggerUrl).toContain('ws://');

      client = await CdpClient.connect(target.webSocketDebuggerUrl);
      await client.send('Runtime.enable');
      await client.send('Page.enable');

      const navigate = async (url: string) => {
        const loaded = client?.once('Page.loadEventFired');
        await client?.send('Page.navigate', { url });
        await loaded;
        await new Promise((resolve) => setTimeout(resolve, 150));
      };
      const getCourseCta = () => client?.evaluate<{ text: string; href: string }>(`(() => {
        const cta = document.querySelector('[data-course-cta]');
        return {
          text: cta?.textContent?.trim() ?? '',
          href: cta?.getAttribute('href') ?? '',
        };
      })()`);

      await navigate(applicationUrl);
      const initialCta = await getCourseCta();
      expect(initialCta).toEqual({ text: 'Comenzar curso básico', href: '/aprender' });
      expect(initialCta?.text).not.toContain('Continuar donde te quedaste');

      const initialProgress = createInitialProgress();
      const validProgress = {
        ...initialProgress,
        currentSection: 'seccion-01',
        currentLesson: '01-01',
        currentPage: '01-01-p01',
        completedPageIds: ['01-01-p01'],
        schemaVersion: PROGRESS_SCHEMA_VERSION,
      };
      await client?.evaluate(
        `localStorage.setItem(${JSON.stringify(PROGRESS_STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(validProgress))})`,
      );

      await navigate(applicationUrl);
      const resumedRootCta = await getCourseCta();
      expect(resumedRootCta).toEqual({ text: 'Continuar donde te quedaste', href: resumePath });
      const rootNavigation = client?.once('Page.loadEventFired');
      await client?.evaluate(`document.querySelector('[data-course-cta]')?.click()`);
      await rootNavigation;
      expect(await client?.evaluate<string>('window.location.pathname')).toBe(resumePath);
      expect(await client?.evaluate<boolean>(`window.location.pathname !== ${JSON.stringify(`${basePath}/aprender/`)}`)).toBe(true);

      await navigate(`${applicationOrigin}${basePath}/aprender/`);
      expect(await getCourseCta()).toEqual({ text: 'Continuar donde te quedaste', href: resumePath });

      const invalidProgress = {
        ...initialProgress,
        currentSection: 'seccion-01',
        currentLesson: '01-02',
        currentPage: 'missing-page',
        schemaVersion: PROGRESS_SCHEMA_VERSION,
      };
      await client?.evaluate(
        `localStorage.setItem(${JSON.stringify(PROGRESS_STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(invalidProgress))})`,
      );
      await navigate(applicationUrl);
      const fallbackCta = await getCourseCta();
      expect(fallbackCta).toEqual({ text: 'Continuar donde te quedaste', href: resumePath });
      const fallbackNavigation = client?.once('Page.loadEventFired');
      await client?.evaluate(`document.querySelector('[data-course-cta]')?.click()`);
      await fallbackNavigation;
      expect(await client?.evaluate<string>('window.location.pathname')).toBe(resumePath);
      expect(client?.exceptions).toEqual([]);
    } finally {
      if (client) {
        try {
          await client.send('Browser.close');
        } catch {
          // El cierre forzado del proceso se realiza a continuación.
        } finally {
          client.close();
        }
      }
      const shutdownResults = await Promise.allSettled([
        browserProcess ? stopBrowser(browserProcess) : Promise.resolve(),
        astroProcess ? stopBrowser(astroProcess) : Promise.resolve(),
        buildProcess ? stopBrowser(buildProcess) : Promise.resolve(),
      ]);
      const profileCleanupResults = await Promise.allSettled([
        rm(profileDirectory, {
          recursive: true,
          force: true,
          maxRetries: 10,
          retryDelay: 100,
        }),
      ]);
      const cleanupFailure = [...shutdownResults, ...profileCleanupResults].find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );
      if (cleanupFailure) throw cleanupFailure.reason;
    }
  }, 75_000);

  it('descarga PNG y SVG desde los chunks dinámicos de la aplicación Astro real', async ({ skip }) => {
    const browser = availableBrowser;
    if (!browser) {
      const message = 'No se encontró Brave, Google Chrome o Chromium. Define BROWSER_BIN con la ruta de un navegador compatible.';
      if (process.env.BROWSER_TESTS_REQUIRED === '1') throw new Error(message);
      return skip(message);
    }

    let astroProcess: ChildProcess | null = null;
    let browserProcess: ChildProcess | null = null;
    let client: CdpClient | null = null;
    let astroProcessFailure: Error | null = null;
    let browserProcessFailure: Error | null = null;
    let astroReady = false;
    let browserReady = false;
    let astroOutput = '';
    const profileDirectory = await mkdtemp(join(tmpdir(), 'texdock-astro-browser-'));
    const downloadDirectory = join(profileDirectory, 'downloads');
    await mkdir(downloadDirectory);

    try {
      const applicationPort = await getFreePort();
      const applicationUrl = `http://127.0.0.1:${applicationPort}/laboratorio/`;
      const applicationOrigin = new URL(applicationUrl).origin;
      const astroExecutable = join(
        process.cwd(),
        'node_modules',
        'astro',
        'bin',
        'astro.mjs',
      );
      const astroEnvironment = Object.fromEntries(
        Object.entries(process.env).filter(([name]) => !name.startsWith('VITEST')),
      );
      astroProcess = spawn(process.execPath, [
        astroExecutable,
        'dev',
        '--host',
        '127.0.0.1',
        '--port',
        String(applicationPort),
        '--ignore-lock',
      ], {
        env: {
          ...astroEnvironment,
          ASTRO_DEV_BACKGROUND: '0',
          NODE_ENV: 'development',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      astroProcess.stdout?.on('data', (chunk) => {
        astroOutput += String(chunk);
      });
      astroProcess.stderr?.on('data', (chunk) => {
        astroOutput += String(chunk);
      });
      astroProcess.once('error', (error) => {
        astroProcessFailure = new Error(
          `No se pudo iniciar Astro: ${error.message}`,
          { cause: error },
        );
      });
      astroProcess.once('exit', (code, signal) => {
        if (!astroReady) {
          astroProcessFailure = new Error(
            `Astro terminó antes de servir la página `
            + `(código ${String(code)}, señal ${String(signal)}).\n${astroOutput}`,
          );
        }
      });
      await waitForApplication(
        applicationUrl,
        () => astroProcessFailure,
        () => astroOutput,
      );
      astroReady = true;

      const debuggerPort = await getFreePort();
      browserProcess = spawn(browser.executable, [
        ...browser.prefixArguments,
        '--headless=new',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--no-first-run',
        '--no-default-browser-check',
        '--remote-debugging-address=127.0.0.1',
        `--remote-debugging-port=${debuggerPort}`,
        `--user-data-dir=${profileDirectory}`,
        'about:blank',
      ], { stdio: 'ignore' });
      browserProcess.once('error', (error) => {
        browserProcessFailure = new Error(
          `No se pudo iniciar ${browser.name}: ${error.message}`,
          { cause: error },
        );
      });
      browserProcess.once('exit', (code, signal) => {
        if (!browserReady) {
          browserProcessFailure = new Error(
            `${browser.name} terminó antes de abrir DevTools `
            + `(código ${String(code)}, señal ${String(signal)}).`,
          );
        }
      });

      await waitForBrowser(
        debuggerPort,
        browser.name,
        () => browserProcessFailure,
      );
      browserReady = true;
      const target = await (
        await fetch(
          `http://127.0.0.1:${debuggerPort}/json/new?${encodeURIComponent(applicationUrl)}`,
          { method: 'PUT' },
        )
      ).json() as { webSocketDebuggerUrl: string };

      client = await CdpClient.connect(target.webSocketDebuggerUrl);
      await client.send('Runtime.enable');
      await client.send('Network.enable');
      await client.send('Page.enable');
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: 1024,
        height: 800,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await client.send('Browser.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadDirectory,
        eventsEnabled: true,
      });
      const loaded = client.once('Page.loadEventFired');
      await client.send('Page.navigate', { url: applicationUrl });
      await loaded;
      await waitForEditor(client);

      const skipState = await client.evaluate<{
        destinationExists: boolean;
        focusVisible: boolean;
        href: string;
        mainCount: number;
      }>(`(() => {
        const skip = document.querySelector('.skip-link');
        const main = document.querySelector('#main-content');
        skip?.focus();
        return {
          destinationExists: Boolean(main),
          focusVisible: Boolean(skip?.matches(':focus-visible')),
          href: skip?.getAttribute('href') ?? '',
          mainCount: document.querySelectorAll('main').length,
        };
      })()`);
      expect(skipState.href).toBe('#main-content');
      expect(skipState.destinationExists).toBe(true);
      expect(skipState.mainCount).toBe(1);
      expect(skipState.focusVisible).toBe(true);

      const desktopGeometry = await client.evaluate<{
        editor: { height: number; top: number; width: number };
        editorFontSize: number;
        noRootOverflow: boolean;
        preview: { height: number; top: number; width: number };
        previewFontSize: number;
        previewHeading: string;
        scrollbarColor: string;
      }>(`(() => {
        const editor = document.querySelector('.input-panel .latex-editor-wrapper').getBoundingClientRect();
        const preview = document.querySelector('.preview-container').getBoundingClientRect();
        const editorContent = document.querySelector('.math-playground .cm-content');
        const formula = document.querySelector('.math-playground .preview-container .katex');
        return {
          editor: { height: editor.height, top: editor.top, width: editor.width },
          preview: { height: preview.height, top: preview.top, width: preview.width },
          editorFontSize: Number.parseFloat(getComputedStyle(editorContent).fontSize),
          previewFontSize: Number.parseFloat(getComputedStyle(formula).fontSize),
          scrollbarColor: getComputedStyle(document.querySelector('.preview-container')).scrollbarColor,
          noRootOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
          previewHeading: document.querySelector('.preview-panel .input-label')?.textContent?.trim() ?? '',
        };
      })()`);
      expect(desktopGeometry.previewHeading).toBe('Vista previa');
      expect(Math.abs(desktopGeometry.editor.width - desktopGeometry.preview.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(desktopGeometry.editor.height - desktopGeometry.preview.height)).toBeLessThanOrEqual(1);
       expect(Math.abs(desktopGeometry.editor.top - desktopGeometry.preview.top)).toBeLessThanOrEqual(1);
       expect(desktopGeometry.noRootOverflow).toBe(true);
       expect(desktopGeometry.editorFontSize).toBeGreaterThan(13);
       expect(desktopGeometry.previewFontSize).toBeGreaterThan(16);
       expect(desktopGeometry.scrollbarColor).not.toBe('');

      const longFormula = `\\displaystyle ${Array.from({ length: 48 }, (_, index) => `x_{${index}}`).join('+')}`;
      await client.evaluate(`document.querySelector('.cm-content').focus()`);
      await client.send('Input.dispatchKeyEvent', {
        type: 'rawKeyDown', modifiers: 2, key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65,
      });
      await client.send('Input.dispatchKeyEvent', {
        type: 'keyUp', modifiers: 2, key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65,
      });
      await client.send('Input.insertText', { text: longFormula });
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(await client.evaluate<boolean>(`(() => {
        const preview = document.querySelector('.preview-container');
        return preview.scrollWidth > preview.clientWidth
          && document.documentElement.scrollWidth <= document.documentElement.clientWidth;
      })()`)).toBe(true);

      await client.send('Emulation.setDeviceMetricsOverride', {
        width: 320,
        height: 740,
        deviceScaleFactor: 1,
        mobile: true,
      });
      const mobileGeometry = await client.evaluate<{
        columns: string;
        editorHeight: number;
        editorWidth: number;
        noRootOverflow: boolean;
        previewHeight: number;
        previewWidth: number;
      }>(`(() => {
        const editor = document.querySelector('.input-panel .latex-editor-wrapper').getBoundingClientRect();
        const preview = document.querySelector('.preview-container').getBoundingClientRect();
        return {
          columns: getComputedStyle(document.querySelector('.playground-layout')).gridTemplateColumns,
          editorHeight: editor.height,
          editorWidth: editor.width,
          previewHeight: preview.height,
          previewWidth: preview.width,
          noRootOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        };
      })()`);
      expect(mobileGeometry.columns.trim().split(/\s+/)).toHaveLength(1);
      expect(Math.abs(mobileGeometry.editorWidth - mobileGeometry.previewWidth)).toBeLessThanOrEqual(1);
       expect(Math.abs(mobileGeometry.editorHeight - mobileGeometry.previewHeight)).toBeLessThanOrEqual(1);
       expect(mobileGeometry.editorHeight).toBe(240);
       expect(mobileGeometry.noRootOverflow).toBe(true);
       await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
       expect(await client.evaluate<boolean>(`(() => {
         return window.visualViewport?.scale === 2
           && document.documentElement.scrollWidth <= document.documentElement.clientWidth;
       })()`)).toBe(true);
       await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });

       await client.send('Emulation.setDeviceMetricsOverride', {
        width: 640,
        height: 800,
        deviceScaleFactor: 1,
        mobile: false,
      });
       const themeState = await client.evaluate<{ changed: boolean; rootOverflow: boolean; scrollbarColor: string }>(`(() => {
         const preview = document.querySelector('.preview-container');
         const before = document.documentElement.dataset.theme;
         const beforeScrollbar = getComputedStyle(preview).scrollbarColor;
         document.querySelector('[data-theme-toggle]').click();
         return {
           changed: before !== document.documentElement.dataset.theme
             && beforeScrollbar !== getComputedStyle(preview).scrollbarColor,
           rootOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
           scrollbarColor: getComputedStyle(preview).scrollbarColor,
         };
        })()`);
       expect(await client.evaluate<boolean>(`(() => {
         const layout = document.querySelector('.playground-layout');
         return getComputedStyle(layout).gridTemplateColumns.trim().split(/\s+/).length === 1;
       })()`)).toBe(true);
       expect(themeState.changed).toBe(true);
        expect(themeState.rootOverflow).toBe(true);
        expect(themeState.scrollbarColor).not.toBe('');

      await client.send('Emulation.setDeviceMetricsOverride', {
        width: 1024,
        height: 800,
        deviceScaleFactor: 1,
        mobile: false,
      });

      expect(client.requests.some((url) => url.includes('mathJaxSvgRuntime'))).toBe(false);
      expect(client.requests.some((url) => url.includes('@mathjax'))).toBe(false);

      await client.evaluate(`document.querySelector('.cm-content').focus()`);
      await client.send('Input.dispatchKeyEvent', {
        type: 'rawKeyDown',
        modifiers: 2,
        key: 'a',
        code: 'KeyA',
        windowsVirtualKeyCode: 65,
      });
      await client.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        modifiers: 2,
        key: 'a',
        code: 'KeyA',
        windowsVirtualKeyCode: 65,
      });
      await client.send('Input.insertText', { text: '\\frac{1}{2}' });

      const statusExpression = 'document.querySelector(".status-message")?.textContent?.trim() ?? ""';
      const validDeadline = Date.now() + 5_000;
      let status = '';
      let downloadsEnabled = false;
      while (Date.now() < validDeadline) {
        status = await client.evaluate<string>(statusExpression);
        downloadsEnabled = await client.evaluate<boolean>(`(() => {
          const buttons = [...document.querySelectorAll('button')];
          const svg = buttons.find((button) => button.textContent === 'Descargar SVG');
          const png = buttons.find((button) => button.textContent === 'Descargar PNG');
          return Boolean(svg && png && !svg.disabled && !png.disabled);
        })()`);
        if (status.includes('Expresión válida') && downloadsEnabled) break;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(status).toContain('Expresión válida');
      expect(downloadsEnabled).toBe(true);
      expect(await client.evaluate<string>(
        'document.querySelector(".cm-content")?.textContent ?? ""',
      )).toContain('\\frac{1}{2}');

      await client.evaluate(`(() => {
        window.__astroFormulaStatusHistory = [];
        window.__astroPngInspection = {
          alphaAtMargin: null,
          hasBlackPixel: false,
          height: 0,
          mime: '',
          ready: false,
          signature: [],
          size: 0,
          width: 0,
        };
        const originalCreateObjectURL = URL.createObjectURL.bind(URL);
        URL.createObjectURL = (blob) => {
          if (blob.type === 'image/png') {
            const inspection = window.__astroPngInspection;
            inspection.mime = blob.type;
            inspection.size = blob.size;
            (async () => {
              const bytes = new Uint8Array(await blob.arrayBuffer());
              const bitmap = await createImageBitmap(blob);
              const canvas = document.createElement('canvas');
              canvas.width = bitmap.width;
              canvas.height = bitmap.height;
              const context = canvas.getContext('2d', { willReadFrequently: true });
              if (!context) throw new Error('Canvas 2D no disponible para inspeccionar PNG.');
              context.drawImage(bitmap, 0, 0);
              const pixels = context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
              ).data;
              let hasBlackPixel = false;
              for (let index = 0; index < pixels.length; index += 4) {
                if (
                  pixels[index + 3] > 0
                  && pixels[index] < 32
                  && pixels[index + 1] < 32
                  && pixels[index + 2] < 32
                ) {
                  hasBlackPixel = true;
                  break;
                }
              }
              inspection.signature = [...bytes.slice(0, 8)];
              inspection.width = bitmap.width;
              inspection.height = bitmap.height;
              inspection.alphaAtMargin = pixels[3];
              inspection.hasBlackPixel = hasBlackPixel;
              inspection.ready = true;
              bitmap.close();
            })().catch((error) => {
              inspection.error = String(error?.stack ?? error);
              inspection.ready = true;
            });
          }
          return originalCreateObjectURL(blob);
        };
        const status = document.querySelector('.status-message');
        new MutationObserver(() => {
          window.__astroFormulaStatusHistory.push(status?.textContent?.trim() ?? '');
        }).observe(status, {
          childList: true,
          characterData: true,
          subtree: true,
        });
      })()`);
      await client.evaluate(`(
        [...document.querySelectorAll('button')]
          .find((button) => button.textContent === 'Descargar PNG')
      ).click()`);

      const downloadDeadline = Date.now() + 20_000;
      let pngDownloaded = false;
      let pngReady = false;
      let statusHistory: string[] = [];
      while (Date.now() < downloadDeadline && !(pngDownloaded && pngReady)) {
        status = await client.evaluate<string>(statusExpression);
        statusHistory = await client.evaluate<string[]>(
          'window.__astroFormulaStatusHistory',
        );
        pngDownloaded = client.downloads.some(
          (event) => event.method === 'Browser.downloadProgress'
            && event.params.state === 'completed',
        );
        pngReady = await client.evaluate<boolean>(
          'window.__astroPngInspection.ready',
        );
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      expect(statusHistory).not.toContain('No se pudo cargar el generador SVG. Inténtalo de nuevo.');
      expect(statusHistory).not.toContain('No se pudo generar el PNG. Inténtalo de nuevo.');
      expect(statusHistory).toContain('Generando PNG…');
      expect(statusHistory).toContain('PNG descargado');
      expect(client.downloads, JSON.stringify(client.downloads, null, 2)).toContainEqual(expect.objectContaining({
        method: 'Browser.downloadWillBegin',
        params: expect.objectContaining({
          suggestedFilename: 'formula-texdock.png',
        }),
      }));
      expect(pngDownloaded).toBe(true);
      const pngInspection = await client.evaluate<{
        alphaAtMargin: number | null;
        error?: string;
        hasBlackPixel: boolean;
        height: number;
        mime: string;
        ready: boolean;
        signature: number[];
        size: number;
        width: number;
      }>('window.__astroPngInspection');
      expect(pngInspection.error).toBeUndefined();
      expect(pngInspection.mime).toBe('image/png');
      expect(pngInspection.size).toBeGreaterThan(0);
      expect(pngInspection.signature).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
      expect(pngInspection.width).toBeGreaterThan(0);
      expect(pngInspection.height).toBeGreaterThan(0);
      expect(pngInspection.alphaAtMargin).toBe(0);
      expect(pngInspection.hasBlackPixel).toBe(true);
      expect(client.requests.some((url) => url.includes('mathJaxSvgRuntime'))).toBe(true);
      expect(client.requests.some((url) => url.includes('@mathjax'))).toBe(true);

      const completedAfterPng = client.downloads.filter(
        (event) => event.method === 'Browser.downloadProgress'
          && event.params.state === 'completed',
      ).length;
      await client.evaluate(`(
        [...document.querySelectorAll('button')]
          .find((button) => button.textContent === 'Descargar SVG')
      ).click()`);
      const svgDeadline = Date.now() + 20_000;
      let svgDownloaded = false;
      while (Date.now() < svgDeadline) {
        statusHistory = await client.evaluate<string[]>(
          'window.__astroFormulaStatusHistory',
        );
        const completed = client.downloads.filter(
          (event) => event.method === 'Browser.downloadProgress'
            && event.params.state === 'completed',
        ).length;
        svgDownloaded = completed > completedAfterPng;
        if (statusHistory.includes('SVG descargado') && svgDownloaded) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      expect(statusHistory).toContain('Generando SVG…');
      expect(statusHistory).toContain('SVG descargado');
      expect(client.downloads, JSON.stringify(client.downloads, null, 2)).toContainEqual(expect.objectContaining({
        method: 'Browser.downloadWillBegin',
        params: expect.objectContaining({
          suggestedFilename: 'formula-texdock.svg',
        }),
      }));
      expect(svgDownloaded).toBe(true);

      await client.send('Emulation.setDeviceMetricsOverride', {
        width: 320,
        height: 740,
        deviceScaleFactor: 1,
        mobile: true,
      });
      const courseLoaded = client.once('Page.loadEventFired');
      await client.send('Page.navigate', {
        url: `${applicationOrigin}/aprender/seccion-01/01-01/la-idea-principal/`,
      });
      await courseLoaded;
      const courseState = await client.evaluate<{
        hasCourseNavigation: boolean;
        hasMainContent: boolean;
        mainCount: number;
        noRootOverflow: boolean;
        skipHref: string;
      }>(`(() => ({
        hasCourseNavigation: Boolean(document.querySelector('.sidebar, .lesson-navigation')),
        hasMainContent: Boolean(document.querySelector('#main-content')),
        mainCount: document.querySelectorAll('main').length,
        noRootOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        skipHref: document.querySelector('.skip-link')?.getAttribute('href') ?? '',
      }))()`);
      expect(courseState.hasCourseNavigation).toBe(true);
      expect(courseState.hasMainContent).toBe(true);
      expect(courseState.mainCount).toBe(1);
      expect(courseState.noRootOverflow).toBe(true);
      expect(courseState.skipHref).toBe('#main-content');

      expect(client.failedResponses).toEqual([]);
      expect(client.exceptions).toEqual([]);
    } finally {
      if (client) {
        try {
          await client.send('Browser.close');
        } catch {
          // El cierre forzado del proceso se realiza a continuación.
        } finally {
          client.close();
        }
      }
      const shutdownResults = await Promise.allSettled([
        browserProcess ? stopBrowser(browserProcess) : Promise.resolve(),
        astroProcess ? stopBrowser(astroProcess) : Promise.resolve(),
      ]);
      const profileCleanupResults = await Promise.allSettled([
        rm(profileDirectory, {
          recursive: true,
          force: true,
          maxRetries: 10,
          retryDelay: 100,
        }),
      ]);
      const cleanupFailure = [...shutdownResults, ...profileCleanupResults].find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );
      if (cleanupFailure) throw cleanupFailure.reason;
    }
  }, 60_000);
});
