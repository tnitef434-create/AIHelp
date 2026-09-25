const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn, execSync } = require('child_process');
const path = require('path');

// Each provider is a locally installed CLI run in non-interactive mode.
const PROVIDERS = {
  claude: {
    label: 'Claude Code',
    bin: 'claude',
    models: ['default', 'opus', 'sonnet', 'haiku'],
    args: (prompt, model) => ['-p', prompt, ...(model !== 'default' ? ['--model', model] : [])],
  },
  codex: {
    label: 'Codex',
    bin: 'codex',
    models: ['default', 'gpt-5', 'gpt-5-codex', 'o3'],
    args: (prompt, model) => ['exec', '--skip-git-repo-check', ...(model !== 'default' ? ['-m', model] : []), prompt],
  },
  opencode: {
    label: 'OpenCode',
    bin: 'opencode',
    models: ['default', 'anthropic/claude-sonnet-4-5', 'openai/gpt-5'],
    args: (prompt, model) => ['run', ...(model !== 'default' ? ['-m', model] : []), prompt],
  },
};

function isInstalled(bin) {
  try {
    execSync(process.platform === 'win32' ? `where ${bin}` : `command -v ${bin}`, { stdio: 'ignore', shell: true });
    return true;
  } catch { return false; }
}

ipcMain.handle('providers', () =>
  Object.entries(PROVIDERS).map(([id, p]) => ({ id, label: p.label, models: p.models, installed: isInstalled(p.bin) })));

let running = null;
ipcMain.on('send', (event, { provider, model, prompt }) => {
  const p = PROVIDERS[provider];
  if (!p) return;
  const child = spawn(p.bin, p.args(prompt, model), { shell: process.platform === 'win32', cwd: app.getPath('home') });
  running = child;
  child.stdout.on('data', (d) => event.sender.send('chunk', d.toString()));
  child.stderr.on('data', (d) => event.sender.send('chunk', d.toString()));
  child.on('error', (e) => event.sender.send('chunk', `\n[error] ${e.message}\n`));
  child.on('close', (code) => { running = null; event.sender.send('done', code); });
});
ipcMain.on('stop', () => running && running.kill());

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1000, height: 720, title: 'AI Hub', backgroundColor: '#111318',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  win.setMenuBarVisibility(false);
  win.loadFile('index.html');
});
app.on('window-all-closed', () => app.quit());
