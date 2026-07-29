import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createNetworkServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer as createViteServer, type ViteDevServer } from 'vite';
import { describe, expect, it } from 'vitest';

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

async function waitForBrowser(port: number): Promise<{ webSocketDebuggerUrl: string }> {
  const deadline = Date.now() + 15_000;
  let lastError: unknown;
  while (Date.now() < deadline) {
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
  throw new Error(`Brave no abrió DevTools: ${String(lastError)}`);
}

async function waitForEditor(client: CdpClient): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (await client.evaluate<boolean>('Boolean(document.querySelector(".cm-editor"))')) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('LatexCodeEditor no montó .cm-editor.');
}

describe('LatexCodeEditor en un DOM de navegador real', () => {
  it('monta CodeMirror, despacha cambios y ejecuta Limpiar, Restaurar y Copiar', async () => {
    let viteServer: ViteDevServer | null = null;
    let browserProcess: ChildProcess | null = null;
    let client: CdpClient | null = null;
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
      browserProcess = spawn('flatpak', [
        'run',
        'com.brave.Browser',
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--remote-debugging-address=127.0.0.1',
        `--remote-debugging-port=${debuggerPort}`,
        `--user-data-dir=${profileDirectory}`,
        'about:blank',
      ], { stdio: 'ignore' });

      await waitForBrowser(debuggerPort);
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
          client.close();
        }
      }
      if (browserProcess && browserProcess.exitCode === null) {
        browserProcess.kill('SIGTERM');
      }
      if (viteServer) await viteServer.close();
      await rm(profileDirectory, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 100,
      });
    }
  }, 30_000);
});
