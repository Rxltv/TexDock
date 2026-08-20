import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { access, mkdir, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { spawn } from 'node:child_process';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedRoot = join(projectRoot, 'public', 'engine');
const assetRoot = join(generatedRoot, 'busytex');
const archivePath = join(generatedRoot, '.busytex-assets-v1.4.0.tar.gz');
const downloadUrl = 'https://github.com/TeXlyre/texlyre-busytex/releases/download/assets-v1.4.0/busytex-assets.tar.gz';
const expectedSha256 = '1caa434fb5aab5bdd59dc303bca2ac7b9b9af02ef1627bf8652caabfa1b7cd2b';
const requiredFiles = [
  'busytex.js',
  'busytex.wasm',
  'busytex_worker.js',
  'busytex_biber.js',
  'busytex_pipeline.js',
  'texlive-basic.js',
  'texlive-basic.data',
];

async function hasRequiredAssets() {
  try {
    await Promise.all(requiredFiles.map((file) => access(join(assetRoot, file))));
    const data = await stat(join(assetRoot, 'texlive-basic.data'));
    return data.size > 80 * 1024 * 1024;
  } catch {
    return false;
  }
}

function run(command, args) {
  return new Promise((resolveProcess, rejectProcess) => {
    const child = spawn(command, args, { cwd: projectRoot, stdio: 'inherit' });
    child.once('error', rejectProcess);
    child.once('close', (code) => {
      if (code === 0) resolveProcess();
      else rejectProcess(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function downloadArchive() {
  const response = await fetch(downloadUrl, { redirect: 'follow' });
  if (!response.ok || !response.body) {
    throw new Error(`BusyTeX assets download failed: HTTP ${response.status}`);
  }

  const hash = createHash('sha256');
  const hashingTransform = new Transform({
    transform(chunk, _encoding, callback) {
      hash.update(chunk);
      callback(null, chunk);
    },
  });

  await pipeline(
    Readable.fromWeb(response.body),
    hashingTransform,
    createWriteStream(archivePath),
  );

  const actualSha256 = hash.digest('hex');
  if (actualSha256 !== expectedSha256) {
    await rm(archivePath, { force: true });
    throw new Error(`BusyTeX assets checksum mismatch: expected ${expectedSha256}, got ${actualSha256}`);
  }
}

if (await hasRequiredAssets()) {
  console.log('BusyTeX assets v1.4.0 already prepared.');
} else {
  await mkdir(generatedRoot, { recursive: true });
  console.log('Downloading pinned BusyTeX assets v1.4.0...');
  await downloadArchive();
  await rm(assetRoot, { recursive: true, force: true });
  await run('tar', ['-xzf', archivePath, '-C', generatedRoot]);
  await rm(archivePath, { force: true });
  if (!(await hasRequiredAssets())) {
    throw new Error('BusyTeX assets were extracted but required files are missing.');
  }
  console.log('BusyTeX assets v1.4.0 prepared and verified.');
}
