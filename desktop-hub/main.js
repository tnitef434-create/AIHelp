const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Each provider is a locally installed CLI run in non-interactive mode with structured (JSONL)
// output. Its permissions come from the chat's access level (see *_ACCESS below), and it runs in
// the chat's working folder. parse() turns one output line into
// normalized events for the renderer:
//   { kind: 'session', id }                 CLI session id, used to resume the conversation
//   { kind: 'thinking', text }              the model's reasoning / thought process
//   { kind: 'text', text }                  answer text
//   { kind: 'tool', id, action, target, added, removed, output, status }
//                                           a tool call (action: read/edit/write/delete/run/search/web/agent/other)
//   { kind: 'usage', input, output, reasoning, cached, cost }
//   { kind: 'error', text }
// Models are { id, label, efforts? }; efforts lists the thinking levels a model supports.
const DEFAULT = { id: 'default', label: 'Default (CLI setting)' };
const isWin = process.platform === 'win32';
const run = (cmd) => execSync(cmd, { encoding: 'utf8', shell: true, timeout: 60000, maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] });
const stripAnsi = (t) => t.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
const level = (id, description) => ({ id, label: description ? `${id} — ${description}` : id });
const lines = (s) => (s ? String(s).split('\n').length : 0);

function diffCounts(diff) {
  let added = 0, removed = 0;
  for (const l of String(diff || '').split('\n')) {
    if (l.startsWith('+') && !l.startsWith('+++')) added++;
    else if (l.startsWith('-') && !l.startsWith('---')) removed++;
  }
  return { added, removed };
}

// Spawns a CLI with a shell on Windows (they are .cmd shims). Never pass user text as an
// argument there: cmd.exe would split/interpret it. User text goes over stdin instead.
// .exe files run directly (arguments pass through untouched); .cmd shims need cmd.exe, which
// needs paths with spaces quoted.
function spawnCli(bin, args, cwd) {
  const raw = bin.replace(/^"|"$/g, '');
  const direct = !isWin || /\.exe$/i.test(raw);
  return spawn(direct ? raw : /\s/.test(raw) ? `"${raw}"` : raw, args, { shell: !direct, cwd: cwd || app.getPath('home') });
}

function killTree(child) {
  // kill() would only stop the cmd.exe wrapper on Windows, leaving the CLI running.
  if (isWin) spawn('taskkill', ['/pid', String(child.pid), '/T', '/F']);
  else child.kill();
}

// --- Persistent data (chat history, last seen usage limits) -------------------
const dataDir = () => app.getPath('userData');
const chatsDir = () => { const d = path.join(dataDir(), 'chats'); fs.mkdirSync(d, { recursive: true }); return d; };
const readJson = (f, fallback) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fallback; } };
const limitsFile = () => path.join(dataDir(), 'limits.json');
function saveLimit(provider, key, value) {
  const all = readJson(limitsFile(), {});
  (all[provider] ||= {})[key] = { ...value, seenAt: Date.now() };
  fs.writeFileSync(limitsFile(), JSON.stringify(all));
}

// --- Claude Code ------------------------------------------------------------
const CLAUDE_EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'].map((e) => level(e));
// Built-in claude commands that only make sense in its interactive UI, not with -p.
const CLAUDE_TUI_ONLY = new Set(['clear', 'color', 'config', 'doctor', 'effort', 'fast', 'heapdump', 'mcp', 'model',
  'rename', 'usage', 'agents', 'context', 'reload-skills', 'auto-mode-setup', 'design-consent', 'design-revoke',
  'team-onboarding', 'insights', 'recap', 'goal', 'loop', 'skill-doctor', 'fewer-permission-prompts', 'update-config']);

// Access levels: read = read-only; edit = edit files inside the working folder without asking;
// full = edit and run anything without asking (not limited to the folder).
const CLAUDE_ACCESS = { read: 'plan', edit: 'acceptEdits', full: 'bypassPermissions' };

function claudeTool(b) {
  const i = b.input || {};
  const t = { kind: 'tool', id: b.id, status: 'running' };
  switch (b.name) {
    case 'Read': return { ...t, action: 'read', target: i.file_path };
    case 'Edit': return { ...t, action: 'edit', target: i.file_path, added: lines(i.new_string), removed: lines(i.old_string) };
    case 'MultiEdit': return { ...t, action: 'edit', target: i.file_path,
      added: (i.edits || []).reduce((n, e) => n + lines(e.new_string), 0),
      removed: (i.edits || []).reduce((n, e) => n + lines(e.old_string), 0) };
    case 'Write': return { ...t, action: 'write', target: i.file_path, added: lines(i.content) };
    case 'NotebookEdit': return { ...t, action: 'edit', target: i.notebook_path };
    case 'Bash': case 'PowerShell': return { ...t, action: 'run', target: i.command };
    case 'Grep': case 'Glob': return { ...t, action: 'search', target: i.pattern };
    case 'WebFetch': return { ...t, action: 'web', target: i.url };
    case 'WebSearch': return { ...t, action: 'web', target: i.query };
    case 'Task': case 'Agent': return { ...t, action: 'agent', target: i.description };
    default: return { ...t, action: 'other', target: b.name };
  }
}

function parseClaude(o, emit) {
  if (o.type === 'system' && o.subtype === 'init') emit({ kind: 'session', id: o.session_id });
  else if (o.type === 'assistant' && o.message && o.message.model !== '<synthetic>') {
    for (const b of o.message.content || []) {
      if (b.type === 'thinking' && b.thinking) emit({ kind: 'thinking', text: b.thinking });
      else if (b.type === 'text' && b.text) emit({ kind: 'text', text: b.text });
      else if (b.type === 'tool_use') emit(claudeTool(b));
    }
  } else if (o.type === 'user' && o.message) {
    for (const b of o.message.content || []) {
      if (b.type !== 'tool_result') continue;
      const out = typeof b.content === 'string' ? b.content : (b.content || []).map((c) => c.text || '').join('\n');
      emit({ kind: 'tool', id: b.tool_use_id, status: b.is_error ? 'error' : 'done', output: out });
    }
  } else if (o.type === 'rate_limit_event' && o.rate_limit_info) {
    const r = o.rate_limit_info;
    saveLimit('claude', r.rateLimitType || 'limit', r);
  } else if (o.type === 'result') {
    if (o.is_error) emit({ kind: 'error', text: o.result || o.subtype });
    const u = o.usage || {};
    emit({ kind: 'usage', input: (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0), cached: u.cache_read_input_tokens || 0,
      output: u.output_tokens || 0, cost: o.total_cost_usd });
  }
}

// --- Codex (ChatGPT) ----------------------------------------------------------
// workspace-write lets codex write only inside the working folder.
const CODEX_ACCESS = { read: 'read-only', edit: 'workspace-write', full: 'danger-full-access' };

// Codex wraps commands as `powershell.exe -Command "..."`; show just the inner command.
function codexCommand(cmd) {
  const m = /-Command\s+(["'])([\s\S]*)\1\s*$/.exec(cmd || '');
  return m ? (m[1] === '"' ? m[2].replace(/\\"/g, '"') : m[2].replace(/''/g, "'")) : cmd;
}

function parseCodex(o, emit) {
  if (o.type === 'thread.started') emit({ kind: 'session', id: o.thread_id });
  else if (o.type === 'turn.completed' && o.usage) {
    const u = o.usage;
    emit({ kind: 'usage', input: u.input_tokens, cached: u.cached_input_tokens, output: u.output_tokens, reasoning: u.reasoning_output_tokens });
  } else if (o.type === 'turn.failed') emit({ kind: 'error', text: (o.error && o.error.message) || 'Turn failed' });
  else if (o.type === 'error') emit({ kind: 'error', text: o.message });
  else if ((o.type === 'item.started' || o.type === 'item.updated' || o.type === 'item.completed') && o.item) {
    const it = o.item, done = o.type === 'item.completed';
    switch (it.type) {
      case 'reasoning': if (done && it.text) emit({ kind: 'thinking', text: it.text }); break;
      case 'agent_message': if (done && it.text) emit({ kind: 'text', text: it.text }); break;
      case 'command_execution':
        emit({ kind: 'tool', id: it.id, action: 'run', target: codexCommand(it.command), output: it.aggregated_output,
          status: it.status === 'in_progress' ? 'running' : it.exit_code ? 'error' : 'done' });
        break;
      case 'file_change':
        (it.changes || []).forEach((c, n) => emit({ kind: 'tool', id: `${it.id}:${n}`, target: c.path,
          action: c.kind === 'add' ? 'write' : c.kind === 'delete' ? 'delete' : 'edit',
          status: it.status === 'failed' ? 'error' : done ? 'done' : 'running' }));
        break;
      case 'mcp_tool_call':
        emit({ kind: 'tool', id: it.id, action: 'other', target: `${it.server}.${it.tool}`, status: done ? 'done' : 'running' });
        break;
      case 'web_search': emit({ kind: 'tool', id: it.id, action: 'web', target: it.query, status: done ? 'done' : 'running' }); break;
      case 'error':
        // Config warnings from ~/.codex/config.toml are not failures of this turn.
        if (!/unrecognized configuration/i.test(it.message || '')) emit({ kind: 'error', text: it.message });
        break;
    }
  }
}

// Codex exposes the ChatGPT plan's usage windows through its app-server JSON-RPC API.
function codexLimits() {
  return new Promise((resolve) => {
    const child = spawnCli(binOf('codex'), ['app-server']);
    let buf = '', done = false;
    const finish = (v) => { if (done) return; done = true; killTree(child); resolve(v); };
    child.stdout.on('data', (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1);
        let msg; try { msg = JSON.parse(line); } catch { continue; }
        if (msg.id === 1) {
          child.stdin.write(JSON.stringify({ method: 'initialized' }) + '\n');
          child.stdin.write(JSON.stringify({ id: 2, method: 'account/rateLimits/read' }) + '\n');
        } else if (msg.id === 2) {
          const r = msg.result && msg.result.rateLimits;
          if (!r) return finish({ items: [{ label: 'Usage limits', detail: (msg.error && msg.error.message) || 'Unavailable' }] });
          const win = (w) => {
            const m = w.windowDurationMins;
            const name = m === 300 ? '5-hour' : m === 10080 ? 'Weekly' : m >= 43000 ? 'Monthly' : m ? `${Math.round(m / 60)}-hour` : 'Usage';
            return { label: `${name} limit`, pct: w.usedPercent, resetsAt: w.resetsAt ? w.resetsAt * 1000 : null };
          };
          const items = [r.primary, r.secondary].filter(Boolean).map(win);
          if (r.credits && (r.credits.hasCredits || r.credits.unlimited)) {
            items.push({ label: 'Credits', detail: r.credits.unlimited ? 'Unlimited' : String(r.credits.balance) });
          }
          finish({ plan: r.planType, items, reached: r.rateLimitReachedType });
        }
      }
    });
    child.stdin.on('error', () => {});
    child.stdin.write(JSON.stringify({ id: 1, method: 'initialize', params: { clientInfo: { name: 'onyx', version: '1.0.0' } } }) + '\n');
    child.on('close', () => finish({ items: [{ label: 'Usage limits', detail: 'Unavailable' }] }));
    setTimeout(() => finish({ items: [{ label: 'Usage limits', detail: 'Timed out' }] }), 20000);
  });
}

// --- OpenCode ---------------------------------------------------------------
// The plan agent cannot edit; the default build agent edits and auto-rejects anything that
// would need approval; --auto approves everything not explicitly denied.
const OPENCODE_ACCESS = { read: ['--agent', 'plan'], edit: [], full: ['--auto'] };

// OpenCode lists ~145 models, most of them image/audio/embedding/safety or small/outdated models.
// Only these strong chat and coding models are shown (in this order).
const OPENCODE_PICKS = [
  'opencode/big-pickle', 'opencode/nemotron-3-ultra-free', 'opencode/ling-3.0-flash-fin-free', 'opencode/mimo-v2.6-flash-free',
  'google/gemini-3.1-pro-preview', 'google/gemini-3.8-flash',
  'nvidia/deepseek-ai/deepseek-v4-pro-0813', 'nvidia/deepseek-ai/deepseek-v4-flash-0731',
  'nvidia/moonshotai/kimi-k3', 'nvidia/z-ai/glm-5.3', 'nvidia/minimaxai/minimax-m3',
  'nvidia/qwen/qwen3.5-397b-a17b', 'nvidia/qwen/qwen3-coder-480b-a35b-instruct',
  'nvidia/mistralai/mistral-large-3-675b-instruct-2512', 'nvidia/nvidia/nemotron-3-ultra-550b-a55b', 'nvidia/openai/gpt-oss-120b',
];

function parseOpencode(o, emit, state) {
  if (o.sessionID && !state.session) { state.session = o.sessionID; emit({ kind: 'session', id: o.sessionID }); }
  const p = o.part || {};
  if (o.type === 'reasoning' && p.text) emit({ kind: 'thinking', text: p.text });
  else if (o.type === 'text' && p.text) emit({ kind: 'text', text: p.text });
  else if (o.type === 'error') emit({ kind: 'error', text: (o.error && (o.error.data && o.error.data.message || o.error.message || o.error.name)) || 'Error' });
  else if (o.type === 'tool_use' && p.state) {
    const s = p.state, i = s.input || {}, meta = s.metadata || {};
    const t = { kind: 'tool', id: p.callID || p.id, output: s.output || s.error,
      status: s.status === 'error' ? 'error' : s.status === 'completed' ? 'done' : 'running' };
    switch (p.tool) {
      case 'read': emit({ ...t, action: 'read', target: i.filePath }); break;
      case 'edit': case 'patch': case 'multiedit': emit({ ...t, action: 'edit', target: i.filePath, ...diffCounts(meta.diff), output: undefined }); break;
      case 'write': emit({ ...t, action: 'write', target: i.filePath, added: lines(i.content), output: undefined }); break;
      case 'bash': emit({ ...t, action: 'run', target: i.command }); break;
      case 'glob': case 'grep': case 'list': emit({ ...t, action: 'search', target: i.pattern || i.path }); break;
      case 'webfetch': case 'websearch': emit({ ...t, action: 'web', target: i.url || i.query }); break;
      case 'task': emit({ ...t, action: 'agent', target: i.description }); break;
      case 'todowrite': case 'todoread': break;
      default: emit({ ...t, action: 'other', target: p.tool });
    }
  } else if (o.type === 'step_finish' && p.tokens) {
    const u = state.usage ||= { kind: 'usage', input: 0, output: 0, reasoning: 0, cached: 0, cost: 0 };
    u.input += p.tokens.input || 0; u.output += p.tokens.output || 0; u.reasoning += p.tokens.reasoning || 0;
    u.cached += (p.tokens.cache && p.tokens.cache.read) || 0; u.cost += p.cost || 0;
  }
}

// `opencode stats` prints box-drawn tables; pull out the totals.
function opencodeLimits() {
  try {
    const t = run(`${binOf('opencode')} stats`);
    const get = (k) => { const m = new RegExp(`${k}\\s+([^│\\n]+?)\\s*│`).exec(t); return m && m[1].trim(); };
    return { items: [
      { label: 'Plan limits', detail: 'None — billed per provider (free models cost $0)' },
      { label: 'Total cost', detail: get('Total Cost') || '?' },
      { label: 'Tokens in / out', detail: `${get('Input') || '?'} / ${get('Output') || '?'}` },
      { label: 'Sessions', detail: get('Sessions') || '?' },
    ] };
  } catch { return { items: [{ label: 'Usage', detail: 'Unavailable' }] }; }
}

// --- Providers --------------------------------------------------------------
const PROVIDERS = {
  claude: {
    label: 'Claude Code',
    bin: 'claude',
    // The claude CLI has no model-list command, so these are the current full model ids.
    models: () => [
      { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 — most capable', efforts: CLAUDE_EFFORTS },
      { id: 'claude-fable-5-1', label: 'Claude Fable 5.1', efforts: CLAUDE_EFFORTS },
      { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 — balanced', efforts: CLAUDE_EFFORTS },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 — fastest' },
    ],
    args: ({ model, effort, session, access }) => ['-p', '--output-format', 'stream-json', '--verbose',
      '--permission-mode', CLAUDE_ACCESS[access] || 'plan',
      ...(model !== 'default' ? ['--model', model] : []),
      ...(effort ? ['--effort', effort] : []),
      ...(session ? ['--resume', session] : [])],
    parse: parseClaude,
    // The stream-json init event lists the session's slash commands; stop right after it.
    commands: () => new Promise((resolve) => {
      const child = spawnCli(binOf('claude'), ['-p', '--output-format', 'stream-json', '--verbose']);
      let buf = '', done = false;
      const finish = (list) => { if (done) return; done = true; killTree(child); resolve(list); };
      child.stdout.on('data', (d) => {
        buf += d;
        if (!buf.includes('\n')) return;
        try {
          const init = JSON.parse(buf.split('\n')[0]);
          const skills = new Set(init.skills || []);
          finish((init.slash_commands || [])
            .filter((c) => !c.startsWith('_') && !CLAUDE_TUI_ONLY.has(c))
            .map((name) => ({ name, description: skills.has(name) ? 'skill' : 'Claude Code command' })));
        } catch { finish([]); }
      });
      child.stdin.on('error', () => {});
      child.stdin.end('.');
      child.on('close', () => finish([]));
      setTimeout(() => finish([]), 20000);
    }),
    // claude -p runs "/name args" prompts as slash commands.
    commandRun: (name) => ({ args: [], input: (text) => `/${name} ${text}`.trim() }),
    limits: () => {
      const seen = readJson(limitsFile(), {}).claude || {};
      const names = { five_hour: '5-hour limit', seven_day: 'Weekly limit', seven_day_opus: 'Weekly Opus limit', seven_day_sonnet: 'Weekly Sonnet limit' };
      const items = Object.entries(seen).map(([k, r]) => ({
        label: names[k] || k.replace(/_/g, ' '),
        pct: typeof r.utilization === 'number' ? Math.round(r.utilization <= 1 ? r.utilization * 100 : r.utilization) : undefined,
        detail: r.status === 'allowed' ? 'OK' : r.status,
        resetsAt: r.resetsAt ? (r.resetsAt < 1e12 ? r.resetsAt * 1000 : r.resetsAt) : null,
      }));
      return { items: items.length ? items : [{ label: 'Usage limits', detail: 'Shown after your next Claude reply' }] };
    },
  },
  codex: {
    label: 'ChatGPT',
    bin: 'codex',
    models: () => JSON.parse(run(`${binOf('codex')} debug models`)).models
      .filter((m) => m.visibility === 'list')
      .map((m) => ({
        id: m.slug,
        label: `${m.display_name} — ${m.description}`,
        efforts: (m.supported_reasoning_levels || []).map((l) => level(l.effort, l.description)),
        defaultEffort: m.default_reasoning_level,
      })),
    // `exec resume` has no --sandbox flag, so the sandbox is set through config for both.
    args: ({ model, effort, session, access }) => ['exec', ...(session ? ['resume'] : []), '--json', '--skip-git-repo-check',
      '-c', `sandbox_mode=${CODEX_ACCESS[access] || 'read-only'}`,
      '-c', 'model_reasoning_summary=detailed',
      ...(model !== 'default' ? ['-m', model] : []),
      ...(effort ? ['-c', `model_reasoning_effort=${effort}`] : []),
      ...(session ? [session] : []), '-'],
    parse: parseCodex,
    // codex exec has no slash commands (they only exist in its interactive UI).
    limits: codexLimits,
  },
  opencode: {
    label: 'OpenCode',
    bin: 'opencode',
    // `--verbose` prints each "provider/model" line followed by its JSON details.
    models: () => {
      const out = [];
      const re = /^([\w.-]+\/\S+)\r?\n(\{[\s\S]*?\r?\n\})/gm;
      for (const [, id, json] of run(`${binOf('opencode')} models --verbose`).matchAll(re)) {
        let m = {};
        try { m = JSON.parse(json); } catch {}
        if (m.status && m.status !== 'active') continue;
        if (!OPENCODE_PICKS.includes(id)) continue;
        const ctx = m.limit && m.limit.context ? ` · ${Math.round(m.limit.context / 1000)}k ctx` : '';
        const free = m.cost && m.cost.input === 0 && m.cost.output === 0 ? ' · free' : '';
        out.push({ id, label: `${m.name || id} (${id})${ctx}${free}`, efforts: Object.keys(m.variants || {}).map((v) => level(v)) });
      }
      return out.sort((a, b) => OPENCODE_PICKS.indexOf(a.id) - OPENCODE_PICKS.indexOf(b.id));
    },
    args: ({ model, effort, session, access }) => ['run', '--format', 'json', '--thinking',
      ...(OPENCODE_ACCESS[access] || OPENCODE_ACCESS.read),
      ...(model !== 'default' ? ['-m', model] : []),
      ...(effort ? ['--variant', effort] : []),
      ...(session ? ['-s', session] : [])],
    parse: parseOpencode,
    // Commands (built-in, custom and skills) are only exposed by opencode's server API.
    commands: () => new Promise((resolve) => {
      const port = 47000 + Math.floor(Math.random() * 2000);
      const child = spawnCli(binOf('opencode'), ['serve', '--port', String(port)]);
      let done = false;
      const finish = (list) => { if (done) return; done = true; killTree(child); resolve(list); };
      const poll = async (tries) => {
        try {
          const list = await (await fetch(`http://127.0.0.1:${port}/command`)).json();
          finish(list.map((c) => ({ name: c.name, description: c.description || c.source || '' })));
        } catch { if (tries > 0 && !done) setTimeout(() => poll(tries - 1), 500); else finish([]); }
      };
      child.on('close', () => finish([]));
      setTimeout(() => poll(40), 1000);
    }),
    commandRun: (name) => ({ args: ['--command', name], input: (text) => text }),
    limits: opencodeLimits,
  },
};

// --- Provider setup: detection, manual locations, custom CLIs ------------------
// providers.json in userData holds { paths: { claude: 'C:\\...\\claude.cmd' }, custom: [{ id, label, command, args }] }.
const setupFile = () => path.join(dataDir(), 'providers.json');
const loadSetup = () => ({ paths: {}, custom: [], ...readJson(setupFile(), {}) });
const saveSetup = (s) => fs.writeFileSync(setupFile(), JSON.stringify(s, null, 2));

// How to install/sign in to each built-in CLI, shown to new users.
const INSTALL = {
  claude: { install: 'npm install -g @anthropic-ai/claude-code', login: 'claude', loginHint: 'then type /login', site: 'https://claude.com/claude-code' },
  codex: { install: 'npm install -g @openai/codex', login: 'codex login', site: 'https://github.com/openai/codex' },
  opencode: { install: 'npm install -g opencode-ai', login: 'opencode auth login', site: 'https://opencode.ai' },
};

// Places CLIs commonly end up when they are not on PATH (npm global dir, per-user installs).
function searchDirs() {
  const home = app.getPath('home');
  const dirs = isWin
    ? [path.join(process.env.APPDATA || '', 'npm'), path.join(process.env.LOCALAPPDATA || '', 'Programs'),
       path.join(home, '.local', 'bin'), path.join(home, 'AppData', 'Local', 'Microsoft', 'WinGet', 'Links'),
       path.join(home, 'scoop', 'shims'), path.join(home, '.bun', 'bin'), 'C:\\Program Files\\nodejs']
    : [path.join(home, '.local', 'bin'), path.join(home, '.npm-global', 'bin'), path.join(home, '.bun', 'bin'),
       '/usr/local/bin', '/opt/homebrew/bin', '/usr/bin'];
  try { dirs.push(execSync('npm prefix -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], shell: true, timeout: 8000 }).trim() + (isWin ? '' : '/bin')); } catch {}
  return dirs;
}

// Resolves a CLI to a runnable path: saved manual location, then PATH, then common folders.
const resolved = {};
function resolveBin(name, id) {
  const setup = loadSetup();
  const manual = id && setup.paths[id];
  if (manual && fs.existsSync(manual)) return { path: manual, via: 'manual' };
  try {
    const out = execSync(isWin ? `where ${name}` : `command -v ${name}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], shell: true, timeout: 8000 });
    const hits = out.split(/\r?\n/).filter(Boolean);
    // On Windows prefer the .cmd/.exe shim over the extensionless (bash) script npm also creates.
    const best = (isWin && hits.find((h) => /\.(cmd|exe|bat)$/i.test(h))) || hits[0];
    if (best) return { path: best, via: 'PATH' };
  } catch {}
  const exts = isWin ? ['.cmd', '.exe', '.bat', ''] : [''];
  for (const dir of searchDirs()) {
    for (const ext of exts) {
      const f = path.join(dir, name + ext);
      if (dir && fs.existsSync(f) && fs.statSync(f).isFile()) return { path: f, via: 'search' };
    }
  }
  return null;
}
// Shell-safe command for a resolved CLI (paths with spaces must be quoted for cmd.exe).
function binOf(id) {
  const r = resolved[id];
  const bin = r ? r.path : (PROVIDERS[id] && PROVIDERS[id].bin) || id;
  return isWin && /\s/.test(bin) ? `"${bin}"` : bin;
}
function detect(id) {
  const p = PROVIDERS[id];
  resolved[id] = resolveBin(p.bin, id);
  return resolved[id];
}

// Custom providers: any CLI that takes the prompt on stdin and prints plain text.
function splitArgs(s) {
  const out = []; const re = /"([^"]*)"|'([^']*)'|(\S+)/g; let m;
  while ((m = re.exec(s || ''))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}
function loadCustom() {
  for (const id of Object.keys(PROVIDERS)) if (PROVIDERS[id].custom) delete PROVIDERS[id];
  for (const c of loadSetup().custom) {
    PROVIDERS[c.id] = { label: c.label, bin: c.command, custom: true, plain: true, models: () => [],
      args: () => splitArgs(c.args), parse: () => {}, limits: () => ({ items: [{ label: 'Usage limits', detail: 'Not reported by this CLI' }] }) };
  }
}

function models(p) {
  try { return [DEFAULT, ...p.models()]; } catch { return [DEFAULT]; }
}

function describe(id) {
  const p = PROVIDERS[id], r = detect(id);
  return { id, label: p.label, custom: !!p.custom, installed: !!r, path: r ? r.path : null, via: r ? r.via : null,
    command: p.bin, args: p.custom ? (loadSetup().custom.find((c) => c.id === id) || {}).args : undefined,
    guide: INSTALL[id] || null, models: r ? models(p) : [DEFAULT] };
}
ipcMain.handle('providers', () => { loadCustom(); return Object.keys(PROVIDERS).map(describe); });
ipcMain.handle('npmAvailable', () => !!resolveBin('npm'));

ipcMain.handle('providers:setPath', (_e, id, file) => {
  const s = loadSetup();
  if (file) { if (!fs.existsSync(file)) return { ok: false, error: 'That file does not exist.' }; s.paths[id] = file; }
  else delete s.paths[id];
  saveSetup(s); delete commandCache[id];
  return { ok: true, provider: describe(id) };
});
ipcMain.handle('providers:addCustom', (_e, c) => {
  const label = String(c.label || '').trim(), command = String(c.command || '').trim();
  if (!label || !command) return { ok: false, error: 'Name and command are required.' };
  const s = loadSetup();
  const id = 'custom-' + (label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ai') + '-' + Date.now().toString(36).slice(-4);
  s.custom.push({ id, label, command, args: String(c.args || '').trim() });
  saveSetup(s); loadCustom();
  return { ok: true, provider: describe(id) };
});
ipcMain.handle('providers:removeCustom', (_e, id) => {
  const s = loadSetup(); s.custom = s.custom.filter((c) => c.id !== id); delete s.paths[id];
  saveSetup(s); loadCustom(); delete resolved[id];
  return { ok: true };
});

const commandCache = {};
ipcMain.handle('commands', (_e, provider) => {
  const p = PROVIDERS[provider];
  if (!p || !p.commands || !resolved[provider]) return [];
  return (commandCache[provider] ||= p.commands().catch(() => []));
});

ipcMain.handle('limits', async (_e, provider) => {
  const p = PROVIDERS[provider];
  if (!p || !resolved[provider]) return { items: [] };
  try { return await p.limits(); } catch { return { items: [{ label: 'Usage limits', detail: 'Unavailable' }] }; }
});

// --- Chat history -----------------------------------------------------------
const chatFile = (id) => path.join(chatsDir(), `${String(id).replace(/[^\w-]/g, '')}.json`);
ipcMain.handle('chats:list', () =>
  fs.readdirSync(chatsDir()).filter((f) => f.endsWith('.json'))
    .map((f) => readJson(path.join(chatsDir(), f), null)).filter(Boolean)
    .map(({ id, title, updated, provider }) => ({ id, title, updated, provider }))
    .sort((a, b) => b.updated - a.updated));
ipcMain.handle('chats:load', (_e, id) => readJson(chatFile(id), null));
ipcMain.handle('chats:save', (_e, chat) => { fs.writeFileSync(chatFile(chat.id), JSON.stringify(chat)); });
ipcMain.handle('chats:delete', (_e, id) => { fs.rmSync(chatFile(id), { force: true }); });

ipcMain.handle('pickFolder', async (e, current) => {
  const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender),
    { properties: ['openDirectory'], defaultPath: current || app.getPath('home') });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('pickFiles', async (e, current) => {
  const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender),
    { properties: ['openFile', 'multiSelections'], defaultPath: current || app.getPath('home') });
  return r.canceled ? [] : r.filePaths;
});
ipcMain.handle('pickFile', async (e, current) => {
  const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender),
    { properties: ['openFile'], defaultPath: current || app.getPath('home') });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('home', () => app.getPath('home'));
ipcMain.on('openExternal', (_e, url) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); });

// --- Running a turn ---------------------------------------------------------
let running = null;
ipcMain.on('send', (event, msg) => {
  const p = PROVIDERS[msg.provider];
  if (!p) return;
  const emit = (ev) => event.sender.send('ev', ev);
  let args = p.args(msg), input = msg.prompt;
  if (msg.command && p.commandRun) {
    const c = p.commandRun(msg.command);
    args = [...args, ...c.args];
    input = c.input(msg.prompt);
  }
  if (!resolved[msg.provider] && !detect(msg.provider)) {
    emit({ kind: 'error', text: `${p.label} was not found on this PC. Open Settings → Providers to install it or set its location.` });
    event.sender.send('done', 1); return;
  }
  const child = spawnCli(binOf(msg.provider), args, msg.cwd && fs.existsSync(msg.cwd) ? msg.cwd : undefined);
  running = child;
  const state = {};
  let buf = '', errText = '', sawError = false;
  // Custom CLIs print plain text: stream it straight into the answer.
  if (p.plain) {
    child.stdin.on('error', () => {});
    child.stdin.end(input);
    child.stdout.on('data', (d) => emit({ kind: 'text', delta: true, text: stripAnsi(d.toString()) }));
    child.stderr.on('data', (d) => { errText += stripAnsi(d.toString()); });
    child.on('error', (e) => { sawError = true; emit({ kind: 'error', text: e.message }); });
    child.on('close', (code) => {
      running = null;
      if (code && !sawError && !child.stopped) emit({ kind: 'error', text: errText.trim() || `Exited with code ${code}` });
      event.sender.send('done', child.stopped ? 'stopped' : code);
    });
    return;
  }
  const handle = (line) => {
    line = line.trim();
    if (!line) return;
    let o;
    try { o = JSON.parse(line); } catch { errText += line + '\n'; return; }
    p.parse(o, (ev) => { if (ev.kind === 'error') sawError = true; emit(ev); }, state);
  };
  child.stdin.on('error', () => {});
  child.stdin.end(input);
  child.stdout.on('data', (d) => {
    buf += stripAnsi(d.toString());
    let i;
    while ((i = buf.indexOf('\n')) >= 0) { handle(buf.slice(0, i)); buf = buf.slice(i + 1); }
  });
  // stderr is progress/log noise; only show it when the run fails without a reported error.
  child.stderr.on('data', (d) => { errText += stripAnsi(d.toString()); });
  child.on('error', (e) => emit({ kind: 'error', text: e.message }));
  child.on('close', (code) => {
    handle(buf);
    if (state.usage) emit(state.usage);
    running = null;
    if (code && !sawError && !child.stopped) emit({ kind: 'error', text: errText.trim() || `Exited with code ${code}` });
    event.sender.send('done', child.stopped ? 'stopped' : code);
  });
});
ipcMain.on('stop', () => { if (running) { running.stopped = true; killTree(running); } });

// Apps launched from the macOS Dock / Linux menus don't get the terminal's PATH, so CLIs
// (and the node they need) wouldn't be found. Load PATH from the user's login shell.
if (!isWin) {
  try {
    const sh = process.env.SHELL || (process.platform === 'darwin' ? '/bin/zsh' : '/bin/bash');
    const out = execSync(`${sh} -ilc 'printf "__ONYX__%s" "$PATH"'`, { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] });
    const shellPath = out.split('__ONYX__').pop().trim();
    if (shellPath) process.env.PATH = [...new Set([...shellPath.split(':'), ...(process.env.PATH || '').split(':')])].join(':');
  } catch {}
}

// Keep chat history in the folder used before the rename to Onyx.
app.setPath('userData', path.join(app.getPath('appData'), 'ai-hub'));
app.setName('Onyx');
if (isWin) app.setAppUserModelId('Onyx');

// One window only: launching Onyx again focuses the open window.
if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1280, height: 840, minWidth: 760, minHeight: 520, title: 'Onyx', icon: path.join(__dirname, 'icon.png'), backgroundColor: '#000000',
    // Frameless look: the page draws its own title bar; Windows keeps native window buttons.
    titleBarStyle: 'hidden', titleBarOverlay: { color: '#00000000', symbolColor: '#9a9a9a', height: 56 },
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  win.setMenuBarVisibility(false);
  win.loadFile('index.html');
});
app.on('window-all-closed', () => app.quit());
