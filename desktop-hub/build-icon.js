// Renders logo.svg into the app icons:
//   icon.png        256px window icon
//   icon.ico        Windows shortcut / taskbar / installer icon
//   build/icon.png  1024px with the standard macOS margin (macOS + Linux installers)
// Run with: npm run icon
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');

app.disableHardwareAcceleration();
// Keep running between renders (closing the last window would otherwise quit the app).
app.on('window-all-closed', () => {});

// Renders an HTML snippet in an offscreen window and returns it as a nativeImage.
async function render(html, size) {
  const file = path.join(os.tmpdir(), `onyx-icon-${size}-${Date.now()}.html`);
  fs.writeFileSync(file, `<html><body style="margin:0;background:transparent">${html}</body></html>`);
  const win = new BrowserWindow({ width: size, height: size, show: false, frame: false, transparent: true, useContentSize: true });
  await win.loadFile(file);
  await new Promise((r) => setTimeout(r, 300));
  const img = (await win.webContents.capturePage({ x: 0, y: 0, width: size, height: size })).resize({ width: size, height: size, quality: 'best' });
  win.destroy();
  fs.unlinkSync(file);
  return img;
}

app.whenReady().then(async () => {
  const svg = fs.readFileSync(path.join(__dirname, 'logo.svg'), 'utf8');
  const sized = (s, extra = '') => svg.replace('<svg ', `<svg width="${s}" height="${s}" style="display:block${extra}" `);

  // Window icon + Windows .ico (rendered once at 256px, scaled down for smaller sizes).
  const big = await render(sized(256), 256);
  const sizes = [256, 64, 48, 32, 16];
  const pngs = sizes.map((s) => (s === 256 ? big : big.resize({ width: s, height: s, quality: 'best' })).toPNG());
  fs.writeFileSync(path.join(__dirname, 'icon.png'), pngs[0]);

  // ICO container with PNG-compressed entries (supported since Windows Vista).
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach((png, i) => {
    const e = 6 + 16 * i, s = sizes[i];
    header.writeUInt8(s >= 256 ? 0 : s, e); header.writeUInt8(s >= 256 ? 0 : s, e + 1);
    header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(png.length, e + 8); header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  fs.writeFileSync(path.join(__dirname, 'icon.ico'), Buffer.concat([header, ...pngs]));

  // 1024px installer icon: 824px artwork centered with a soft shadow, like native macOS icons.
  const mac = await render(`<div style="padding:100px">${sized(824, ';filter:drop-shadow(0 12px 24px rgba(0,0,0,.35))')}</div>`, 1024);
  fs.mkdirSync(path.join(__dirname, 'build'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'build', 'icon.png'), mac.toPNG());

  console.log('icon.png + icon.ico + build/icon.png written');
  app.exit(0);
});
