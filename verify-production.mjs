import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { join } from 'node:path';

async function getFreePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No se pudo reservar un puerto.');
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

async function waitForPreview(url, process, output) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (process.exitCode !== null || process.signalCode !== null) {
      throw new Error(`Astro preview terminó antes de tiempo.\n${output()}`);
    }
    try {
      await fetch(url, { signal: AbortSignal.timeout(1_000) });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`Astro preview no respondió a tiempo.\n${output()}`);
}

async function stopProcess(process) {
  if (process.exitCode !== null || process.signalCode !== null) return;
  process.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => process.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ]);
  if (process.exitCode === null && process.signalCode === null) process.kill('SIGKILL');
}

const port = await getFreePort();
const origin = `http://127.0.0.1:${port}`;
const astro = join(process.cwd(), 'node_modules', 'astro', 'bin', 'astro.mjs');
let output = '';
const preview = spawn(process.execPath, [
  astro,
  'preview',
  '--host',
  '127.0.0.1',
  '--port',
  String(port),
], { stdio: ['ignore', 'pipe', 'pipe'] });
preview.stdout.on('data', (chunk) => { output += String(chunk); });
preview.stderr.on('data', (chunk) => { output += String(chunk); });

const routes = [
  ['/TexDock/', 200],
  ['/TexDock/aprender/', 200],
  ['/TexDock/laboratorio/', 200],
  ['/TexDock/aprender/seccion-01/01-01/la-idea-principal/', 200],
  ['/TexDock/robots.txt', 200],
  ['/TexDock/sitemap.xml', 200],
  ['/TexDock/biblioteca/', 404],
  ['/TexDock/acerca/', 404],
];

try {
  await waitForPreview(`${origin}/TexDock/`, preview, () => output);
  for (const [path, expectedStatus] of routes) {
    const response = await fetch(`${origin}${path}`, {
      redirect: 'manual',
      signal: AbortSignal.timeout(5_000),
    });
    if (response.status !== expectedStatus) {
      throw new Error(`${path}: se esperaba HTTP ${expectedStatus}, se recibió ${response.status}.`);
    }
    console.log(`${path} ${response.status}`);
  }
} finally {
  await stopProcess(preview);
}
