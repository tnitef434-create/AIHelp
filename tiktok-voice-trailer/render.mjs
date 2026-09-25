// Renders index.html to an MP4, frame by frame.
//   node render.mjs [out.mp4] [--frames 0,45,90]   (--frames = PNG stills only)
// Needs: playwright (Chromium) and an ffmpeg binary (FFMPEG env var or on PATH).
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node22/lib/node_modules/playwright'); }

const here = path.dirname(fileURLToPath(import.meta.url));
const FPS = 30, DUR = 10;
const args = process.argv.slice(2);
const fi = args.indexOf('--frames');
const stills = fi >= 0 ? args[fi + 1].split(',').map(Number) : null;
const out = args.find(a => a.endsWith('.mp4')) || path.join(here, 'trailer.mp4');
const audio = path.join(here, 'audio.wav');
const ffmpeg = process.env.FFMPEG || 'ffmpeg';

const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(here, 'index.html')).href + '?render=1');
await page.waitForFunction(() => window.__ready === true);

if (stills) {
  for (const f of stills) {
    await page.evaluate(t => window.__seek(t), f / FPS);
    await page.screenshot({ path: path.join(here, `still-${String(f).padStart(3, '0')}.png`) });
  }
  await browser.close();
  process.exit(0);
}

const hasAudio = existsSync(audio);
const ff = spawn(ffmpeg, [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  ...(hasAudio ? ['-i', audio] : []),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  ...(hasAudio ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
  out,
], { stdio: ['pipe', 'inherit', 'inherit'] });

const total = FPS * DUR;
for (let i = 0; i < total; i++) {
  await page.evaluate(t => window.__seek(t), i / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 30 === 0) process.stdout.write(`frame ${i}/${total}\n`);
}
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg exited ' + c)))));
await browser.close();
console.log('wrote', out);
