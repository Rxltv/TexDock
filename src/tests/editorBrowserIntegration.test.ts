import { constants, accessSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createNetworkServer } from 'node:net';
import { tmpdir } from 'node:os';
import { delimiter, isAbsolute, join } from 'node:path';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createServer as createViteServer, type ViteDevServer } from 'vite';
import { describe, expect, it } from 'vitest';

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
  throw new Error('LatexCodeEditor no montó .cm-editor.');
}

const availableBrowser = findBrowser();

describe('LatexCodeEditor en un DOM de navegador real', () => {
  it('monta CodeMirror, despacha cambios y ejecuta Limpiar, Restaurar y Copiar', async ({ skip }) => {
    const browser = availableBrowser;
    if (!browser) {
      return skip(
        'No se encontró Brave, Google Chrome o Chromium. '
        + 'Define BROWSER_BIN con la ruta de un navegador compatible.',
      );
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

      const initial = [
        '\\documentclass{article}',
        '\\begin{document}',
        'Código inicial',
        '\\end{document}',
      ].join('\n');
      expect(await client.evaluate<number>('document.querySelectorAll(".cm-editor").length')).toBe(1);
      expect(await client.evaluate<string>('document.querySelector(".cm-content")?.getAttribute("contenteditable")')).toBe('true');
      expect(await client.evaluate<boolean>('window.editorBrowserTest.isReadOnly()')).toBe(false);
      expect(await client.evaluate<string>('window.editorBrowserTest.getCode()')).toBe(initial);

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
});
