const $ = (id) => document.getElementById(id);
const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const base = (p) => (p ? String(p).replace(/[\\/]+$/, '').split(/[\\/]/).pop() : '');
const clip = (s, n) => (s && s.length > n ? s.slice(0, n) + '…' : s || '');
const fmtNum = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(n || 0));

// --- Icons (inline SVG, stroked in currentColor) ------------------------------
const ICONS = {
  plus: 'M12 5v14M5 12h14',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5',
  sidebar: 'M4 5h16v14H4zM9 5v14',
  up: 'M12 19V5M5 12l7-7 7 7',
  stop: 'M8 8h8v8H8z',
  chevron: 'M6 9l6 6 6-6',
  check: 'M5 12.5l4.5 4.5L19 7',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  bolt: 'M13 3L5 14h6l-1 7 8-11h-6z',
  brain: 'M12 4v16M8 6a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 4 4M16 6a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-4 4M8 6a2.5 2.5 0 0 1 4-2M16 6a2.5 2.5 0 0 0-4-2',
  trash: 'M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  terminal: 'M4 5h16v14H4zM7.5 9.5l3 2.5-3 2.5M12.5 15h4',
  bug: 'M9 7a3 3 0 0 1 6 0M7 10h10v5a5 5 0 0 1-10 0zM12 10v10M4 13h3M17 13h3M5 8l2 2M19 8l-2 2M5 19l2-2M19 19l-2-2',
  flask: 'M9 3h6M10 3v6L5 19a1 1 0 0 0 1 1.5h12A1 1 0 0 0 19 19l-5-10V3',
  wand: 'M5 19L15 9M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 11l.7 1.3L21 13l-1.3.7L19 15l-.7-1.3L17 13l1.3-.7z',
  gauge: 'M4 16a8 8 0 1 1 16 0M12 16l4-5',
  monitor: 'M3 5h18v11H3zM8 20h8M12 16v4',
  clip: 'M20 11.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8',
  x: 'M6 6l12 12M18 6L6 18',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  upload: 'M12 16V4M6 10l6-6 6 6M4 20h16',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4',
  alert: 'M12 4L2.5 20h19zM12 10v4.5M12 17.5v.01',
};
function icon(name, size = 16) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', size); svg.setAttribute('height', size);
  svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
  svg.classList.add('ic');
  const p = document.createElementNS(ns, 'path'); p.setAttribute('d', ICONS[name]); svg.append(p);
  return svg;
}
// Provider logos (Claude and OpenAI marks as bundled with Cursor; OpenCode's own favicon).
const LOGOS = {
  claude: { viewBox: '0 0 24 24', paths: [['#D97757', 'm4.709 15.955 4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 0 1-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z']] },
  codex: { viewBox: '0 0 158.7128 157.296', paths: [['#fff', 'M60.8734,57.2556v-14.9432c0-1.2586.4722-2.2029,1.5728-2.8314l30.0443-17.3023c4.0899-2.3593,8.9662-3.4599,13.9988-3.4599,18.8759,0,30.8307,14.6289,30.8307,30.2006,0,1.1007,0,2.3593-.158,3.6178l-31.1446-18.2467c-1.8872-1.1006-3.7754-1.1006-5.6629,0l-39.4812,22.9651ZM131.0276,115.4561v-35.7074c0-2.2028-.9446-3.7756-2.8318-4.8763l-39.481-22.9651,12.8982-7.3934c1.1007-.6285,2.0453-.6285,3.1458,0l30.0441,17.3024c8.6523,5.0341,14.4708,15.7296,14.4708,26.1107,0,11.9539-7.0769,22.965-18.2461,27.527v.0021ZM51.593,83.9964l-12.8982-7.5497c-1.1007-.6285-1.5728-1.5728-1.5728-2.8314v-34.6048c0-16.8303,12.8982-29.5722,30.3585-29.5722,6.607,0,12.7403,2.2029,17.9324,6.1349l-30.987,17.9324c-1.8871,1.1007-2.8314,2.6735-2.8314,4.8764v45.6159l-.0014-.0015ZM79.3562,100.0403l-18.4829-10.3811v-22.0209l18.4829-10.3811,18.4812,10.3811v22.0209l-18.4812,10.3811ZM91.2319,147.8591c-6.607,0-12.7403-2.2031-17.9324-6.1344l30.9866-17.9333c1.8872-1.1005,2.8318-2.6728,2.8318-4.8759v-45.616l13.0564,7.5498c1.1005.6285,1.5723,1.5728,1.5723,2.8314v34.6051c0,16.8297-13.0564,29.5723-30.5147,29.5723v.001ZM53.9522,112.7822l-30.0443-17.3024c-8.652-5.0343-14.471-15.7296-14.471-26.1107,0-12.1119,7.2356-22.9652,18.403-27.5272v35.8634c0,2.2028.9443,3.7756,2.8314,4.8763l39.3248,22.8068-12.8982,7.3938c-1.1007.6287-2.045.6287-3.1456,0ZM52.2229,138.5791c-17.7745,0-30.8306-13.3713-30.8306-29.8871,0-1.2585.1578-2.5169.3143-3.7754l30.987,17.9323c1.8871,1.1005,3.7757,1.1005,5.6628,0l39.4811-22.807v14.9435c0,1.2585-.4721,2.2021-1.5728,2.8308l-30.0443,17.3025c-4.0898,2.359-8.9662,3.4605-13.9989,3.4605h.0014ZM91.2319,157.296c19.0327,0,34.9188-13.5272,38.5383-31.4594,17.6164-4.562,28.9425-21.0779,28.9425-37.908,0-11.0112-4.719-21.7066-13.2133-29.4143.7867-3.3035,1.2595-6.607,1.2595-9.909,0-22.4929-18.2471-39.3247-39.3251-39.3247-4.2461,0-8.3363.6285-12.4262,2.045-7.0792-6.9213-16.8318-11.3254-27.5271-11.3254-19.0331,0-34.9191,13.5268-38.5384,31.4591C11.3255,36.0212,0,52.5373,0,69.3675c0,11.0112,4.7184,21.7065,13.2125,29.4142-.7865,3.3035-1.2586,6.6067-1.2586,9.9092,0,22.4923,18.2466,39.3241,39.3248,39.3241,4.2462,0,8.3362-.6277,12.426-2.0441,7.0776,6.921,16.8302,11.3251,27.5271,11.3251Z']] },
  opencode: { viewBox: '96 96 320 320', paths: [['#5A5858', 'M320 224V352H192V224H320Z'], ['#fff', 'M384 416H128V96H384V416ZM320 160H192V352H320V160Z']] },
};
function mark(p) {
  const m = h('span', 'mark');
  const logo = p && LOGOS[p.id];
  if (!logo) { m.textContent = p ? p.label[0] : '?'; return m; }
  const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', logo.viewBox);
  for (const [fill, d] of logo.paths) {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d); path.setAttribute('fill', fill); path.setAttribute('fill-rule', 'evenodd');
    svg.append(path);
  }
  m.append(svg);
  return m;
}

// --- State ----------------------------------------------------------------------
let providers = [], provider = null, modelId = 'default', effort = '', busy = false, home = '';
let chat = null, liveMsg = null, liveEl = null;
let commands = [], menuItems = [], menuIndex = 0;
const usageCache = {};

// Commands the app handles itself, available for every provider.
const APP_COMMANDS = [
  { name: 'new', description: 'Start a new chat', local: true },
  { name: 'clear', description: 'Start a new chat', local: true },
  { name: 'model', description: 'Switch model: /model <name or id>', local: true },
  { name: 'effort', description: 'Set thinking level: /effort <level>', local: true },
  { name: 'help', description: 'List available commands', local: true },
];

// Workspace = where the AI works and what it may do there:
//   local  -> whole PC, full access (runs from your home folder)
//   folder -> edits inside one folder
//   file   -> edits focused on one file (runs from its folder)
// Any of them can be switched to read-only.
const workspace = (c) => c.workspace || (c.access === 'full' ? 'local' : 'folder');
function applyWorkspace(kind, path) {
  chat.workspace = kind;
  chat.file = kind === 'file' ? path : null;
  chat.cwd = kind === 'local' ? home : kind === 'file' ? path.replace(/[\\/][^\\/]+$/, '') : path;
  chat.access = kind === 'local' ? 'full' : 'edit';
  // CLI sessions are tied to the folder they ran in, so continue with fresh ones.
  chat.sessions = {};
}

const modelName = (m) => (m ? m.label.split(/ — | \(/)[0] : 'Default');
const modelSub = (m) => {
  if (!m) return '';
  const dash = m.label.indexOf(' — ');
  if (dash >= 0) return m.label.slice(dash + 3);
  const paren = m.label.indexOf(' (');
  return paren >= 0 ? m.label.slice(paren + 1).replace(/^\(|\)(?= ·|$)/g, '') : '';
};
const currentModel = () => provider && provider.models.find((m) => m.id === modelId);
const efforts = () => (currentModel() && currentModel().efforts) || [];

// --- Settings (per-PC preferences, kept in localStorage) -------------------------
const SETTINGS_KEY = 'onyx.settings';
const DEFAULT_SETTINGS = { provider: '', workspace: 'local', folder: '', rememberModel: true, models: {},
  enterToSend: true, expandThinking: false, textSize: 'default' };
let settings = { ...DEFAULT_SETTINGS };
try { settings = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; } catch {}
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {} applySettings(); }
function applySettings() {
  document.body.dataset.text = settings.textSize;
  $('in').placeholder = settings.enterToSend ? 'Message Onyx, or type / for commands' : 'Message Onyx (Ctrl+Enter to send)';
  const hint = document.querySelector('.hint');
  if (hint) hint.firstElementChild.textContent = settings.enterToSend ? 'Enter' : 'Ctrl Enter';
}

// --- Chat state ---------------------------------------------------------------
function newChat() {
  // New chats start in the default workspace from Settings.
  const folder = settings.workspace === 'folder' && settings.folder;
  chat = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: 'New chat',
    created: Date.now(), updated: Date.now(), provider: provider ? provider.id : null,
    workspace: folder ? 'folder' : 'local', cwd: folder || home, file: null, access: folder ? 'edit' : 'full', sessions: {}, messages: [] };
  renderChat(); renderHistory();
  $('in').focus();
}
const save = () => { if (chat.messages.length) { chat.updated = Date.now(); return window.hub.chats.save(chat).then(renderHistory); } };

async function openChat(id) {
  if (busy) return;
  const c = await window.hub.chats.load(id);
  if (!c) return;
  chat = c;
  const p = providers.find((x) => x.id === c.provider);
  if (p) selectProvider(p, false);
  if (c.model && provider.models.some((m) => m.id === c.model)) setModel(c.model, false);
  if (c.effort && efforts().some((e) => e.id === c.effort)) effort = c.effort;
  renderChat(); renderHistory(); renderChips();
}

let historyCache = [];
async function renderHistory() {
  historyCache = await window.hub.chats.list();
  drawHistory();
}
function drawHistory() {
  const q = $('search').value.trim().toLowerCase();
  const list = historyCache.filter((c) => !q || c.title.toLowerCase().includes(q));
  const box = $('history');
  box.innerHTML = '';
  if (!list.length) { box.append(h('div', 'hist-empty', q ? 'No matching chats' : 'Your chats will appear here')); return; }
  const day = 864e5, today = new Date().setHours(0, 0, 0, 0);
  const group = (t) => (t >= today ? 'Today' : t >= today - day ? 'Yesterday' : t >= today - 7 * day ? 'Previous 7 days' : 'Older');
  let last = '';
  for (const c of list) {
    const g = group(c.updated);
    if (g !== last) { box.append(h('div', 'hist-group', g)); last = g; }
    const row = h('div', 'chat' + (chat && c.id === chat.id ? ' active' : ''));
    const p = providers.find((x) => x.id === c.provider);
    row.append(mark(p), h('span', 'chat-title', c.title));
    const del = h('button', 'chat-del'); del.title = 'Delete chat'; del.append(icon('trash', 14));
    del.onclick = async (e) => {
      e.stopPropagation();
      if (busy && chat.id === c.id) return;
      if (!await ask({ title: 'Delete chat?', body: `"${c.title}" will be permanently removed.`, ok: 'Delete', danger: true })) return;
      await window.hub.chats.remove(c.id);
      toast('Chat deleted', 'trash');
      if (chat && chat.id === c.id) newChat(); else renderHistory();
    };
    row.append(del);
    row.onclick = () => openChat(c.id);
    box.append(row);
  }
}
$('search').oninput = drawHistory;

// --- Markdown -------------------------------------------------------------------
// Subset: fenced code, headings, lists, quotes, rules, **bold**, *italic*, ~~strike~~, `code`
// and [links](url). Built from DOM nodes, never innerHTML, so model output can't inject markup.
const INLINE = /(`[^`\n]+`|\*\*\*[^*\n]+\*\*\*|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\*[^*\s][^*\n]*\*|\b_[^_\n]+_\b|\[[^\]\n]+\]\([^)\n]+\))/;
function inline(parent, text) {
  for (const part of text.split(INLINE)) {
    if (!part) continue;
    let m;
    if (/^`[^`]+`$/.test(part)) parent.append(h('code', '', part.slice(1, -1)));
    else if (/^\*\*\*[^*]+\*\*\*$/.test(part)) { const b = h('strong'); b.append(h('em', '', part.slice(3, -3))); parent.append(b); }
    else if (/^(\*\*|__)[\s\S]+\1$/.test(part)) { const b = h('strong'); inline(b, part.slice(2, -2)); parent.append(b); }
    else if (/^~~[\s\S]+~~$/.test(part)) { const d = h('del'); inline(d, part.slice(2, -2)); parent.append(d); }
    else if (/^(\*|_)[\s\S]+\1$/.test(part)) { const i = h('em'); inline(i, part.slice(1, -1)); parent.append(i); }
    else if ((m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)) && !/^https?:\/\//.test(m[2])) {
      // Local file links: show the name, full path on hover.
      const c = h('code', '', m[1]); c.title = m[2]; parent.append(c);
    } else if (m) {
      const a = h('a', '', m[1]); a.href = m[2]; a.title = m[2];
      a.onclick = (e) => { e.preventDefault(); window.hub.openExternal(m[2]); };
      parent.append(a);
    } else parent.append(part);
  }
}
function copyButton(getText, label) {
  const b = h('button', 'copy'); b.title = 'Copy'; b.append(icon('copy', 14));
  if (label) b.append(h('span', '', label));
  b.onclick = async () => {
    try { await navigator.clipboard.writeText(getText()); } catch { toast('Could not copy', 'alert'); return; }
    toast('Copied to clipboard');
    b.classList.add('done'); setTimeout(() => b.classList.remove('done'), 1200);
  };
  return b;
}
// Lightweight syntax highlighting: comments, strings, numbers, keywords and function calls.
// Builds text/span nodes only (no innerHTML).
const KEYWORDS = 'const|let|var|function|return|if|else|elif|for|while|do|switch|case|break|continue|new|class|extends|import|from|export|default|async|await|try|catch|except|finally|throw|raise|typeof|instanceof|in|of|def|lambda|pass|with|as|yield|None|True|False|null|undefined|true|false|this|self|public|private|protected|static|void|int|float|string|bool|fn|pub|mut|impl|struct|enum|use|package|func|go|defer|type|interface|and|or|not|echo|then|fi|done|param';
function highlight(code, lang) {
  const hashComments = /^(py|python|sh|bash|zsh|shell|ps|ps1|powershell|yaml|yml|rb|ruby|toml|r|dockerfile|make)$/i.test(lang || '');
  const re = new RegExp(
    `(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/${hashComments ? '|#[^\\n]*' : ''})` +
    '|("(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'|`(?:\\\\.|[^`\\\\])*`)' +
    '|(\\b\\d+(?:\\.\\d+)?\\b)' +
    `|(\\b(?:${KEYWORDS})\\b)` +
    '|(\\b[A-Za-z_$][\\w$]*(?=\\s*\\())', 'g');
  const frag = document.createDocumentFragment();
  let last = 0, m;
  while ((m = re.exec(code))) {
    if (m.index > last) frag.append(code.slice(last, m.index));
    const cls = m[1] ? 'tk-com' : m[2] ? 'tk-str' : m[3] ? 'tk-num' : m[4] ? 'tk-kw' : 'tk-fn';
    frag.append(h('span', cls, m[0]));
    last = re.lastIndex;
    if (!m[0].length) re.lastIndex++;
  }
  frag.append(code.slice(last));
  return frag;
}
function codeBlock(lang, code) {
  const wrap = h('div', 'codeblock');
  const head = h('div', 'code-head');
  head.append(h('span', '', lang || 'code'), copyButton(() => code, 'Copy'));
  const pre = h('pre'); pre.append(highlight(code, lang)); wrap.append(head, pre);
  return wrap;
}
function markdown(text, cls = 'text') {
  const el = h('div', cls);
  // split() with a capture group yields: text, openLang, code, closeLang, text, …
  const parts = text.split(/^```([^\n]*)\n?/m);
  let afterBlock = false;
  // Block elements carry their own spacing, so drop the blank lines around them.
  const block = (node) => {
    while (el.lastChild && el.lastChild.nodeType === 3 && !el.lastChild.textContent.trim()) el.lastChild.remove();
    el.append(node); afterBlock = true;
  };
  for (let i = 0; i < parts.length; i += 4) {
    let list = null, first = true;
    parts[i].split('\n').forEach((line) => {
      let m;
      if ((m = /^\s*(?:[-*+]|(\d+)[.)])\s+(.*)$/.exec(line))) {
        const tag = m[1] ? 'ol' : 'ul';
        if (!list || list.tagName.toLowerCase() !== tag) { list = h(tag); if (m[1]) list.start = +m[1]; block(list); }
        const li = h('li'); inline(li, m[2]); list.append(li); return;
      }
      list = null;
      if ((m = /^(#{1,6})\s+(.*)$/.exec(line))) { const hd = h('div', 'md-h md-h' + m[1].length); inline(hd, m[2]); block(hd); return; }
      if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { block(h('hr')); return; }
      if ((m = /^>\s?(.*)$/.exec(line))) { const q = h('blockquote'); inline(q, m[1]); block(q); return; }
      if (afterBlock && !line.trim()) return;
      if (!afterBlock && !first) el.append('\n');
      afterBlock = false; first = false;
      inline(el, line);
    });
    if (i + 2 < parts.length) block(codeBlock(parts[i + 1].trim(), parts[i + 2].replace(/\n$/, '')));
  }
  return el;
}

// --- Rendering messages -------------------------------------------------------
const VERB = { read: 'Read', edit: 'Edited', write: 'Created', delete: 'Deleted', run: 'Ran', search: 'Searched', web: 'Fetched', agent: 'Agent', other: 'Used' };

// Merge the raw event stream into display blocks: thought process, grouped tool activity,
// answer text, errors and a usage footer. Tool updates (same id) merge into the first entry.
function toBlocks(events) {
  const blocks = [], tools = {};
  let usage = null;
  const last = () => blocks[blocks.length - 1];
  for (const ev of events) {
    if (ev.kind === 'tool') {
      if (tools[ev.id]) { for (const k in ev) if (ev[k] !== undefined) tools[ev.id][k] = ev[k]; continue; }
      const t = tools[ev.id] = { ...ev };
      if (last() && last().type === 'acts') last().tools.push(t); else blocks.push({ type: 'acts', tools: [t] });
    } else if (ev.kind === 'thinking') {
      if (last() && last().type === 'think') last().text += '\n\n' + ev.text; else blocks.push({ type: 'think', text: ev.text });
    } else if (ev.kind === 'text') {
      // delta = a streamed chunk of the same answer (custom CLIs), joined without a paragraph break.
      if (last() && last().type === 'text') last().text += (ev.delta ? '' : '\n\n') + ev.text; else blocks.push({ type: 'text', text: ev.text });
    } else if (ev.kind === 'error') blocks.push({ type: 'error', text: ev.text });
    else if (ev.kind === 'usage') usage = ev;
  }
  return { blocks, usage };
}

// "Read 2 files, edited main.js +99 −22 and ran 1 command"
function actsSummary(tools, el) {
  const order = [], by = {};
  for (const t of tools) { if (!by[t.action]) { by[t.action] = []; order.push(t.action); } by[t.action].push(t); }
  const parts = order.map((a) => {
    const ts = by[a], files = [...new Set(ts.map((t) => t.target))];
    const add = ts.reduce((n, t) => n + (t.added || 0), 0), rem = ts.reduce((n, t) => n + (t.removed || 0), 0);
    const one = files.length === 1;
    const text = {
      read: one ? `read ${base(files[0])}` : `read ${files.length} files`,
      edit: one ? `edited ${base(files[0])}` : `edited ${files.length} files`,
      write: one ? `created ${base(files[0])}` : `created ${files.length} files`,
      delete: one ? `deleted ${base(files[0])}` : `deleted ${files.length} files`,
      run: `ran ${ts.length} command${ts.length > 1 ? 's' : ''}`,
      search: `searched ${ts.length} time${ts.length > 1 ? 's' : ''}`,
      web: `fetched ${ts.length} page${ts.length > 1 ? 's' : ''}`,
      agent: `ran ${ts.length} agent${ts.length > 1 ? 's' : ''}`,
      other: one ? `used ${files[0]}` : `used ${ts.length} tools`,
    }[a];
    return { text, add: ['edit', 'write'].includes(a) ? add : 0, rem: a === 'edit' ? rem : 0 };
  });
  const running = tools.some((t) => t.status === 'running');
  el.append(h('span', 'acts-dot' + (running ? ' live' : '')));
  const label = h('span', 'acts-label');
  parts.forEach((p, i) => {
    let text = p.text;
    if (i === 0) text = text[0].toUpperCase() + text.slice(1);
    label.append(text);
    if (p.add) label.append(' ', h('span', 'add', `+${p.add}`));
    if (p.rem) label.append(' ', h('span', 'del', `−${p.rem}`));
    if (i < parts.length - 2) label.append(', '); else if (i === parts.length - 2) label.append(' and ');
  });
  el.append(label);
}

function toolRow(t) {
  const hasOut = t.output && String(t.output).trim();
  const row = h(hasOut ? 'details' : 'div', 'tool' + (hasOut ? '' : ' plain'));
  row.dataset.key = 't' + t.id;
  const sum = h(hasOut ? 'summary' : 'div', 'tool-sum');
  sum.append(h('span', 'tool-st ' + (t.status || 'done')));
  sum.append(h('span', 'tool-verb', VERB[t.action] || 'Used'));
  const target = t.action === 'run' || t.action === 'search' ? clip(t.target, 160) : base(t.target) || t.target || '';
  const tgt = h('span', 't', target); tgt.title = t.target || '';
  sum.append(tgt);
  if (t.added) sum.append(h('span', 'add', `+${t.added}`));
  if (t.removed) sum.append(h('span', 'del', `−${t.removed}`));
  row.append(sum);
  if (hasOut) row.append(h('pre', '', String(t.output).slice(0, 6000)));
  return row;
}

function messageHead(m) {
  const p = providers.find((x) => x.id === m.provider);
  const head = h('div', 'ai-head');
  head.append(mark(p), h('span', 'ai-name', p ? p.label : 'AI'));
  const detail = m.model || (m.tag ? m.tag.split(' · ').slice(1).join(' · ') : '');
  if (detail) head.append(h('span', 'ai-model', detail));
  return head;
}

// Friendly title for common CLI failures; the raw message stays visible underneath.
function errorTitle(text) {
  const t = String(text).toLowerCase();
  if (/timed? ?out|etimedout/.test(t)) return 'The request timed out';
  if (/not logged in|login|unauthori|401|api key/.test(t)) return 'Sign-in needed';
  if (/rate limit|429|quota|usage limit/.test(t)) return 'Usage limit reached';
  if (/network|enotfound|econn|fetch failed|offline/.test(t)) return 'Connection problem';
  if (/model.*(not found|unavailable|end of life)|gone|410/.test(t)) return 'Model unavailable';
  return 'Something went wrong';
}
function errorCard(text, m) {
  const card = h('div', 'err');
  const ic = h('div', 'err-ic'); ic.append(icon('alert', 16));
  const main = h('div', 'err-main');
  main.append(h('b', '', errorTitle(text)), h('span', '', text));
  const actions = h('div', 'err-actions');
  // Retry resends the user message this reply belongs to (only for the latest reply).
  const i = chat.messages.indexOf(m), prev = chat.messages[i - 1];
  if (m.status !== 'running' && i === chat.messages.length - 1 && prev && prev.role === 'user') {
    const retry = h('button', 'err-btn primary'); retry.append(icon('refresh', 13), h('span', '', 'Retry'));
    retry.onclick = () => {
      if (busy) return;
      $('in').value = prev.text; attachments = (prev.files || []).slice(); renderAttachments();
      $('f').requestSubmit();
    };
    actions.append(retry);
  }
  const copy = copyButton(() => text, 'Copy'); copy.classList.add('err-btn'); actions.append(copy);
  main.append(actions);
  card.append(ic, main);
  return card;
}

function renderAssistant(m, el) {
  // Keep expanded sections open across re-renders while streaming.
  const open = new Set([...el.querySelectorAll('details[open]')].map((d) => d.dataset.key));
  el.innerHTML = '';
  el.append(messageHead(m));
  const body = h('div', 'ai-body');
  const { blocks, usage } = toBlocks(m.events);
  blocks.forEach((b, i) => {
    const key = 'b' + i;
    if (b.type === 'think') {
      const d = h('details', 'think'); d.dataset.key = key;
      const live = m.status === 'running' && i === blocks.length - 1;
      const s = h('summary'); s.append(icon('brain', 14), h('span', live ? 'shimmer' : '', live ? 'Thinking' : 'Thought process'));
      d.append(s, markdown(b.text, 'body'));
      if (settings.expandThinking) d.open = true;
      body.append(d);
    } else if (b.type === 'acts') {
      const d = h('details', 'acts'); d.dataset.key = key;
      const s = h('summary'); actsSummary(b.tools, s);
      const rows = h('div', 'rows'); b.tools.forEach((t) => rows.append(toolRow(t)));
      d.append(s, rows); body.append(d);
    } else if (b.type === 'text') body.append(markdown(b.text));
    else if (b.type === 'error') body.append(errorCard(b.text, m));
  });
  if (m.status === 'running' && !blocks.length) { const w = h('div', 'working'); w.append(h('span', 'shimmer', 'Working')); body.append(w); }
  el.append(body);
  const foot = h('div', 'foot');
  if (m.status === 'stopped') foot.append(h('span', 'pill', 'Stopped'));
  if (usage) {
    const bits = [`${fmtNum(usage.input)} in`];
    if (usage.cached) bits.push(`${fmtNum(usage.cached)} cached`);
    bits.push(`${fmtNum(usage.output)} out`);
    if (usage.reasoning) bits.push(`${fmtNum(usage.reasoning)} thinking`);
    if (typeof usage.cost === 'number') bits.push(`$${usage.cost.toFixed(4)}`);
    foot.append(h('span', '', bits.join('  ·  ')));
  }
  const answer = blocks.filter((b) => b.type === 'text').map((b) => b.text).join('\n\n');
  if (answer && m.status !== 'running') foot.append(copyButton(() => answer));
  if (m.at && m.status !== 'running') {
    const t = h('span', 'time', new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    t.title = new Date(m.at).toLocaleString(); foot.append(t);
  }
  if (foot.childNodes.length) el.append(foot);
  el.querySelectorAll('details').forEach((d) => { if (open.has(d.dataset.key)) d.open = true; });
}

function renderMessage(m) {
  let el;
  if (m.role === 'user') {
    el = h('div', 'msg user');
    if (m.files && m.files.length) { const a = h('div', 'atts'); m.files.forEach((p) => a.append(attChip(p))); el.append(a); }
    if (m.text) el.append(markdown(m.text, 'text'));
    // Hover actions under your own messages: copy, or pull the text back into the box to edit.
    const acts = h('div', 'user-acts');
    const edit = h('button', 'copy'); edit.title = 'Edit and resend'; edit.append(icon('pencil', 14));
    edit.onclick = () => {
      if (busy) return;
      $('in').value = m.text; attachments = (m.files || []).slice(); renderAttachments();
      $('in').focus(); $('in').setSelectionRange(m.text.length, m.text.length);
    };
    acts.append(copyButton(() => m.text), edit);
    const wrap = h('div', 'user-wrap'); wrap.append(el, acts); el = wrap;
  }
  else if (m.role === 'note') { el = h('div', 'msg note'); el.append(icon('spark', 14), h('span', '', m.text)); }
  else { el = h('div', 'msg ai'); renderAssistant(m, el); }
  $('log').append(el);
  return el;
}

// Starter prompts per workspace. Local ones work across the whole PC and report or propose
// before changing anything, since that workspace has full access.
const SUGGESTIONS = {
  local: [
    { icon: 'search', title: 'Find my projects', text: 'Search my PC (Desktop, Documents, Downloads and any code folders) for coding projects. List each with its path, language and when it was last changed.' },
    { icon: 'gauge', title: 'Free up disk space', text: 'Find the largest folders and files on my PC and show what is taking up space. Suggest what is safe to remove, but do not delete anything yet.' },
    { icon: 'folder', title: 'Organize Downloads', text: 'Look at my Downloads folder and propose a tidy folder structure for it. Show me the plan before moving any files.' },
    { icon: 'terminal', title: 'Check my dev setup', text: 'Check which developer tools are installed on this PC (Node, Python, Git, etc.), their versions, and flag anything outdated or missing.' },
  ],
  folder: [
    { icon: 'terminal', title: 'Explain this project', text: 'Give me a tour of the project in this folder: what it does, how it is structured, and where to start.' },
    { icon: 'bug', title: 'Find and fix a bug', text: 'Look through this folder for likely bugs, explain the most serious one and fix it.' },
    { icon: 'flask', title: 'Write tests', text: 'Add tests for the most important untested code in this folder.' },
    { icon: 'wand', title: 'Clean up code', text: 'Pick the messiest file in this folder and refactor it for readability without changing behavior.' },
  ],
  file: [
    { icon: 'file', title: 'Explain this file', text: 'Explain what this file does, section by section, and point out anything unusual.' },
    { icon: 'bug', title: 'Review for bugs', text: 'Review this file for bugs and edge cases. Fix the most serious issue you find.' },
    { icon: 'flask', title: 'Add tests', text: 'Write tests for this file that cover its main behavior and edge cases.' },
    { icon: 'wand', title: 'Improve readability', text: 'Refactor this file for readability without changing its behavior, and summarize what you changed.' },
  ],
};
function renderEmpty() {
  const e = h('div', 'hero');
  const orb = h('div', 'orb'); const img = h('img'); img.src = 'logo.svg'; img.alt = ''; orb.append(img);
  const hr = new Date().getHours();
  const greet = hr < 5 ? 'Up late?' : hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  e.append(orb, h('div', 'hero-kicker', greet), h('h2', '', 'What should we build?'));
  // Context pills: which AI and where it works (clicking opens the matching picker).
  const where = { local: 'Whole PC', folder: base(chat.cwd), file: base(chat.file) }[workspace(chat)] || 'Home';
  const pills = h('div', 'hero-pills');
  const p1 = h('button', 'hero-pill'); p1.append(mark(provider), h('span', '', `${provider ? provider.label : '…'} · ${modelName(currentModel())}`));
  p1.onclick = () => $('modelChip').click();
  const p2 = h('button', 'hero-pill'); p2.append(icon({ local: 'monitor', folder: 'folder', file: 'file' }[workspace(chat)], 14), h('span', '', where));
  p2.onclick = () => $('workspaceChip').click();
  pills.append(p1, p2);
  e.append(pills);
  const grid = h('div', 'suggest');
  for (const s of SUGGESTIONS[workspace(chat)] || SUGGESTIONS.local) {
    const card = h('button', 'card');
    const ic = h('span', 'card-ic'); ic.append(icon(s.icon, 18));
    card.append(ic, h('b', '', s.title), h('span', 'card-text', s.text));
    card.onclick = () => { $('in').value = s.text; autosize(); $('in').focus(); };
    grid.append(card);
  }
  e.append(grid);
  $('log').append(e);
}

function renderChat() {
  $('log').innerHTML = '';
  if (!chat.messages.length) renderEmpty();
  chat.messages.forEach(renderMessage);
  $('scroll').scrollTop = 1e9;
  $('title').textContent = chat.title;
  renderChips();
}

// Notes are shown but never saved or sent to the AI.
function note(text) {
  const e = $('log').querySelector('.hero'); if (e) e.remove();
  renderMessage({ role: 'note', text }); $('scroll').scrollTop = 1e9;
}

// --- Provider / model / thinking / access / folder ------------------------------
function setModel(id, remember = true) {
  modelId = id;
  const m = currentModel();
  effort = (m && m.defaultEffort) || '';
  if (remember && chat) { chat.model = id; chat.effort = effort; }
  if (remember && provider && settings.rememberModel) { settings.models[provider.id] = id; saveSettings(); }
  renderChips();
}

function selectProvider(p, remember = true) {
  provider = p;
  if (remember && chat) chat.provider = p.id;
  // Start on the last model used with this AI (Settings → Remember last model), else the default.
  const saved = settings.rememberModel && settings.models[p.id];
  setModel(saved && p.models.some((m) => m.id === saved) ? saved : p.models[0] ? p.models[0].id : 'default', false);
  if (remember && chat) { chat.model = modelId; chat.effort = effort; }
  commands = APP_COMMANDS;
  if (p.installed) window.hub.commands(p.id).then((list) => { if (provider === p) commands = [...APP_COMMANDS, ...list]; });
  loadUsage();
  const hero = chat && $('log').querySelector('.hero');
  if (hero) { hero.remove(); renderEmpty(); }
}

function chip(el, ic, text, sub) {
  el.innerHTML = '';
  el.append(icon(ic, 14), h('span', 'chip-text', text));
  if (sub) el.append(h('span', 'chip-sub', sub));
  el.append(icon('chevron', 12));
}
function renderChips() {
  if (!provider || !chat) return;
  const mc = $('modelChip');
  mc.innerHTML = '';
  mc.append(mark(provider), h('span', 'chip-text', modelName(currentModel())), icon('chevron', 12));
  mc.title = `${provider.label} · ${currentModel() ? currentModel().label : ''}`;
  const lv = efforts();
  $('effortChip').hidden = !lv.length;
  if (lv.length) chip($('effortChip'), 'brain', effort ? effort[0].toUpperCase() + effort.slice(1) : 'Auto');
  const ws = workspace(chat), ro = chat.access === 'read';
  const text = { local: 'Local', folder: base(chat.cwd) || 'Folder', file: base(chat.file) || 'File' }[ws];
  chip($('workspaceChip'), ro ? 'lock' : { local: 'monitor', folder: 'folder', file: 'file' }[ws], text,
    ro ? 'read-only' : ws === 'local' ? 'full PC access' : '');
  // Keep the start screen's context pills in sync with the pickers.
  const hero = $('log').querySelector('.hero');
  if (hero && !chat.messages.length && hero.querySelector('.hero-pills')) { hero.remove(); renderEmpty(); }
  $('workspaceChip').title = ws === 'local' ? 'Local: the AI can use your whole PC'
    : ws === 'file' ? `File: ${chat.file}` : `Folder: ${chat.cwd}`;
}

// --- Popovers -------------------------------------------------------------------
let popAnchor = null;
function closePop() { $('pop').hidden = true; $('pop').innerHTML = ''; if (popAnchor) popAnchor.classList.remove('open'); popAnchor = null; }
function openPop(anchor, build, width = 320) {
  if (popAnchor === anchor) { closePop(); return; }
  closePop();
  if (busy && anchor.closest('.composer')) return;
  popAnchor = anchor; anchor.classList.add('open');
  const pop = $('pop');
  pop.style.width = width + 'px';
  build(pop);
  pop.hidden = false;
  const r = anchor.getBoundingClientRect(), ph = pop.offsetHeight;
  const left = Math.min(Math.max(12, r.left), innerWidth - width - 12);
  const above = r.top - ph - 8 > 12;
  pop.style.left = left + 'px';
  pop.style.top = (above ? r.top - ph - 8 : r.bottom + 8) + 'px';
  pop.classList.toggle('below', !above);
  const f = pop.querySelector('input'); if (f) f.focus();
}
document.addEventListener('mousedown', (e) => {
  if (!$('pop').hidden && !$('pop').contains(e.target) && !(popAnchor && popAnchor.contains(e.target))) closePop();
});
window.addEventListener('resize', closePop);

function option(title, desc, selected, onPick, ic) {
  const o = h('button', 'opt' + (selected ? ' sel' : ''));
  if (ic) { const i = h('span', 'opt-ic'); i.append(typeof ic === 'string' ? icon(ic, 16) : ic); o.append(i); }
  const t = h('span', 'opt-main'); t.append(h('b', '', title)); if (desc) t.append(h('small', '', desc));
  o.append(t);
  const c = h('span', 'opt-check'); c.append(icon('check', 14)); o.append(c);
  o.onclick = onPick;
  return o;
}

function modelPop(pop) {
  const tabs = h('div', 'seg');
  providers.forEach((p) => {
    const t = h('button', 'seg-btn' + (p === provider ? ' on' : '') + (p.installed ? '' : ' off'));
    t.append(mark(p), h('span', '', p.label));
    t.title = p.installed ? p.label : `${p.label} is not installed`;
    t.onclick = () => { selectProvider(p); drawList(); tabs.querySelectorAll('.seg-btn').forEach((b, i) => b.classList.toggle('on', providers[i] === p)); };
    tabs.append(t);
  });
  const search = h('div', 'pop-search'); const input = h('input'); input.placeholder = 'Search models';
  search.append(icon('search', 14), input);
  const list = h('div', 'opt-list');
  function drawList() {
    list.innerHTML = '';
    const q = input.value.trim().toLowerCase();
    const ms = provider.models.filter((m) => !q || m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
    if (!provider.installed) list.append(h('div', 'opt-empty', `${provider.label} is not installed on this PC.`));
    else if (!ms.length) list.append(h('div', 'opt-empty', 'No models match'));
    ms.forEach((m) => list.append(option(modelName(m), m.id === 'default' ? 'Whatever the CLI is configured to use' : modelSub(m) || m.id,
      m.id === modelId, () => { setModel(m.id); closePop(); })));
    const sel = list.querySelector('.sel'); if (sel) sel.scrollIntoView({ block: 'nearest' });
  }
  input.oninput = drawList;
  input.onkeydown = (e) => { if (e.key === 'Enter') { const f = list.querySelector('.opt'); if (f) f.click(); } };
  pop.append(tabs, search, list);
  drawList();
}

function effortPop(pop) {
  pop.append(h('div', 'pop-title', 'Thinking level'));
  const list = h('div', 'opt-list');
  list.append(option('Auto', "Use the model's default", !effort, () => { effort = ''; chat.effort = ''; renderChips(); closePop(); }));
  efforts().forEach((e) => {
    const [name, ...rest] = e.label.split(' — ');
    list.append(option(name[0].toUpperCase() + name.slice(1), rest.join(' — '), effort === e.id,
      () => { effort = e.id; chat.effort = e.id; renderChips(); closePop(); }));
  });
  pop.append(list);
}

function workspaceChanged(text) {
  renderChips();
  const hero = $('log').querySelector('.hero'); if (hero) { hero.remove(); renderEmpty(); }
  if (chat.messages.length) { note(text); save(); }
}
function workspacePop(pop) {
  pop.append(h('div', 'pop-title', 'Workspace'));
  const list = h('div', 'opt-list'), ws = workspace(chat), ro = chat.access === 'read';
  list.append(option('Local', 'Full access to your whole PC. Edits files and runs commands anywhere without asking.',
    ws === 'local' && !ro, async () => {
      closePop();
      if (ws === 'local' && !ro) return;
      if (!await ask({ title: 'Give full PC access?', body: 'The AI will be able to edit any file and run any command on this PC without asking first.', ok: 'Allow full access', danger: true })) return;
      applyWorkspace('local'); workspaceChanged('Workspace: Local (full PC access)');
    }, 'monitor'));
  list.append(option(ws === 'folder' ? `Folder · ${base(chat.cwd)}` : 'Folder…', 'Pick a folder. The AI edits files only inside it.',
    ws === 'folder' && !ro, async () => {
      closePop();
      const dir = await window.hub.pickFolder(chat.cwd);
      if (!dir) return;
      applyWorkspace('folder', dir); workspaceChanged(`Workspace: folder ${dir}`);
    }, 'folder'));
  list.append(option(ws === 'file' ? `File · ${base(chat.file)}` : 'File…', 'Pick one file. The AI focuses on it and can edit next to it.',
    ws === 'file' && !ro, async () => {
      closePop();
      const file = await window.hub.pickFile(chat.file || chat.cwd);
      if (!file) return;
      applyWorkspace('file', file); workspaceChanged(`Workspace: file ${file}`);
    }, 'file'));
  list.append(h('div', 'opt-sep'));
  list.append(option('Read-only', 'Same workspace, but the AI can only look and suggest.', ro, () => {
    closePop();
    chat.access = ro ? (ws === 'local' ? 'full' : 'edit') : 'read';
    workspaceChanged(ro ? 'Read-only off' : 'Read-only on');
  }, 'lock'));
  pop.append(list);
}

// --- In-app dialogs and toasts (instead of browser confirm/alert) ---------------
function ask({ title, body, ok = 'OK', cancel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    closePop();
    const back = h('div', 'modal-back'), box = h('div', 'modal');
    const ic = h('div', 'modal-ic' + (danger ? ' danger' : '')); ic.append(icon(danger ? 'alert' : 'spark', 20));
    const actions = h('div', 'modal-actions');
    const no = h('button', 'btn', cancel), yes = h('button', 'btn primary' + (danger ? ' danger' : ''), ok);
    actions.append(no, yes);
    box.append(ic, h('h3', '', title), h('p', '', body), actions);
    back.append(box);
    document.body.append(back);
    const done = (v) => { back.classList.add('out'); document.removeEventListener('keydown', key, true); setTimeout(() => back.remove(), 160); resolve(v); };
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); done(false); } else if (e.key === 'Enter') { e.preventDefault(); done(true); } };
    document.addEventListener('keydown', key, true);
    no.onclick = () => done(false); yes.onclick = () => done(true);
    back.onmousedown = (e) => { if (e.target === back) done(false); };
    yes.focus();
  });
}
// --- Attachments (drop files anywhere, or use the paperclip) -------------------
// Files are passed to the AI as paths; every CLI can read files from disk itself.
let attachments = [];
const ext = (p) => { const m = /\.([^.\\/]+)$/.exec(p || ''); return m ? m[1].slice(0, 4).toUpperCase() : 'FILE'; };
function attChip(path, onRemove) {
  const a = h('div', 'att'); a.title = path;
  a.append(h('span', 'att-ic', ext(path)), h('span', '', base(path)));
  if (onRemove) { const x = h('button'); x.type = 'button'; x.title = 'Remove'; x.append(icon('x', 12)); x.onclick = onRemove; a.append(x); }
  return a;
}
function renderAttachments() {
  const box = $('attachments');
  box.innerHTML = '';
  box.hidden = !attachments.length;
  attachments.forEach((p, i) => box.append(attChip(p, () => { attachments.splice(i, 1); renderAttachments(); autosize(); })));
  autosize();
}
function addAttachments(paths) {
  const fresh = paths.filter((p) => p && !attachments.includes(p));
  if (!fresh.length) return;
  attachments.push(...fresh);
  renderAttachments();
  toast(fresh.length === 1 ? `Attached ${base(fresh[0])}` : `Attached ${fresh.length} files`, 'clip');
  $('in').focus();
}
$('attachBtn').onclick = async () => { if (!busy) addAttachments(await window.hub.pickFiles(chat.cwd)); };
let dragDepth = 0;
const hasFiles = (e) => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
window.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; e.preventDefault(); if (++dragDepth === 1 && !busy) $('dropzone').hidden = false; });
window.addEventListener('dragleave', (e) => { if (!hasFiles(e)) return; if (--dragDepth <= 0) { dragDepth = 0; $('dropzone').hidden = true; } });
window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0; $('dropzone').hidden = true;
  if (busy) { toast('Wait for the reply to finish', 'alert'); return; }
  addAttachments([...e.dataTransfer.files].map((f) => window.hub.pathForFile(f)));
});

// --- Settings panel -------------------------------------------------------------
// --- Provider setup (used by the welcome screen and Settings) ---------------------
// Re-detect CLIs and refresh everything that depends on the provider list.
async function reloadProviders() {
  const keep = provider && provider.id;
  providers = await window.hub.providers();
  renderSideFoot();
  const again = providers.find((p) => p.id === keep && p.installed);
  selectProvider(again || providers.find((p) => p.installed) || providers[0], false);
  renderChips();
}

function renderSideFoot() {
  const foot = $('sideFoot');
  foot.innerHTML = '';
  const t = h('div', 'sf-title'); t.append(h('span', '', 'Providers'));
  const manage = h('button', 'sf-manage', 'Manage'); manage.onclick = () => openSettings(); t.append(manage);
  foot.append(t);
  providers.forEach((p) => {
    const row = h('button', 'sf-row' + (p.installed ? '' : ' off'));
    row.append(mark(p), h('span', '', p.label), h('span', 'sf-dot'));
    row.title = p.installed ? `${p.label} · ${p.path}` : `${p.label} is not set up. Click to set it up.`;
    row.onclick = () => (p.installed ? selectProvider(p) : openSettings());
    foot.append(row);
  });
}

// A card per provider: status, location, and install / locate / remove actions.
function providerSetup(container) {
  const draw = async () => {
    container.innerHTML = '';
    const npm = await window.hub.npmAvailable();
    for (const p of providers) {
      const card = h('div', 'pv' + (p.installed ? ' ok' : ''));
      const top = h('div', 'pv-top');
      const info = h('div', 'pv-info');
      info.append(h('b', '', p.label));
      const status = h('span', 'pv-status');
      status.append(h('i'), !p.installed ? (p.custom ? `Command "${p.command}" not found` : 'Not found')
        : p.custom ? 'Ready · custom' : p.via === 'manual' ? 'Set manually' : 'Detected automatically');
      info.append(status);
      const actions = h('div', 'pv-actions');
      const locate = h('button', 'btn sm', p.installed ? 'Change…' : 'Locate…');
      locate.title = 'Choose the program file for this CLI';
      locate.onclick = async () => {
        const file = await window.hub.pickFile(p.path || home);
        if (!file) return;
        const r = await window.hub.setProviderPath(p.id, file);
        if (!r.ok) { toast(r.error, 'alert'); return; }
        await reloadProviders(); draw(); toast(`${p.label} location saved`);
      };
      if (!p.custom) actions.append(locate);
      if (p.via === 'manual' && !p.custom) {
        const reset = h('button', 'btn sm ghost', 'Auto-detect'); reset.title = 'Forget the manual location';
        reset.onclick = async () => { await window.hub.setProviderPath(p.id, null); await reloadProviders(); draw(); };
        actions.append(reset);
      }
      if (p.custom) {
        const rm = h('button', 'btn sm danger-outline', 'Remove');
        rm.onclick = async () => {
          if (!await ask({ title: `Remove ${p.label}?`, body: 'It will disappear from Onyx. The CLI itself stays installed.', ok: 'Remove', danger: true })) return;
          await window.hub.removeCustomProvider(p.id); await reloadProviders(); draw(); toast(`${p.label} removed`, 'trash');
        };
        actions.append(rm);
      }
      top.append(mark(p), info, actions);
      card.append(top);
      if (p.installed) {
        const where = h('div', 'pv-path', p.custom ? `${p.command} ${p.args || ''}`.trim() : p.path); where.title = p.path || '';
        card.append(where);
      }
      // Missing built-in CLI: show how to install it and sign in.
      if (!p.installed && p.guide) {
        const steps = h('div', 'pv-steps');
        const step = (n, label, cmd, extra) => {
          const s = h('div', 'pv-step');
          const code = h('code', '', cmd);
          const copy = copyButton(() => cmd); copy.title = 'Copy command';
          s.append(h('span', 'pv-n', n), h('span', 'pv-label', label), code, copy);
          if (extra) s.append(h('small', '', extra));
          steps.append(s);
        };
        step('1', 'Install', p.guide.install, npm ? '' : 'Needs Node.js (nodejs.org) for npm.');
        step('2', 'Sign in', p.guide.login, p.guide.loginHint || '');
        const more = h('button', 'set-link', 'Website'); more.onclick = () => window.hub.openExternal(p.guide.site);
        const s3 = h('div', 'pv-step last'); s3.append(h('span', 'pv-n', '3'), h('span', 'pv-label', 'Then click Re-scan below.'), more);
        steps.append(s3);
        card.append(steps);
      }
      container.append(card);
    }

    // Manual add: any CLI that reads the prompt on stdin and prints its answer.
    const add = h('div', 'pv add');
    const toggleBtn = h('button', 'pv-add-toggle');
    toggleBtn.append(icon('plus', 14), h('span', '', 'Add another AI (custom CLI)'));
    const form = h('div', 'pv-form'); form.hidden = true;
    const field = (label, ph, hint) => {
      const w = h('label', 'pv-field'); const i = h('input'); i.placeholder = ph; i.spellcheck = false;
      w.append(h('span', '', label), i); if (hint) w.append(h('small', '', hint)); form.append(w); return i;
    };
    const fName = field('Name', 'e.g. Gemini');
    const fCmd = field('Command', 'e.g. gemini', 'The program to run. A full path works too.');
    const fArgs = field('Arguments', 'optional, e.g. --model pro', 'Onyx sends your message on stdin and shows the text it prints.');
    const save = h('button', 'btn primary sm', 'Add AI');
    save.onclick = async () => {
      const r = await window.hub.addCustomProvider({ label: fName.value, command: fCmd.value, args: fArgs.value });
      if (!r.ok) { toast(r.error, 'alert'); return; }
      await reloadProviders(); draw();
      toast(r.provider.installed ? `${r.provider.label} added` : `${r.provider.label} added, but "${r.provider.command}" was not found`, r.provider.installed ? 'check' : 'alert');
    };
    const formActions = h('div', 'pv-form-actions'); formActions.append(save); form.append(formActions);
    toggleBtn.onclick = () => { form.hidden = !form.hidden; if (!form.hidden) fName.focus(); };
    add.append(toggleBtn, form);
    container.append(add);

    const rescan = h('button', 'btn sm ghost pv-rescan'); rescan.append(icon('refresh', 13), h('span', '', 'Re-scan this PC'));
    rescan.onclick = async () => {
      rescan.disabled = true; rescan.lastChild.textContent = 'Scanning…';
      await reloadProviders(); await draw();
      toast(`${providers.filter((p) => p.installed).length} of ${providers.length} AIs ready`);
    };
    container.append(rescan);
  };
  draw();
}

// First launch: welcome screen that shows what was detected and how to set up the rest.
function openWelcome() {
  const back = h('div', 'modal-back'), box = h('div', 'modal settings welcome');
  const head = h('div', 'welcome-head');
  const lg = h('img'); lg.src = 'logo.svg'; lg.alt = '';
  const found = providers.filter((p) => p.installed).length;
  head.append(lg, h('h3', '', 'Welcome to Onyx'),
    h('p', '', found ? `Onyx found ${found} AI${found > 1 ? 's' : ''} on this PC. Set up any others below, or add your own.`
      : 'Onyx connects to AI command-line tools on your PC. Install one below to get started, or add your own.'));
  const body = h('div', 'set-body');
  providerSetup(body);
  const foot = h('div', 'set-foot');
  const go = h('button', 'btn primary', 'Get started');
  const close = () => { settings.onboarded = true; saveSettings(); back.classList.add('out'); setTimeout(() => back.remove(), 160); $('in').focus(); };
  go.onclick = close;
  foot.append(h('span', '', 'You can change this later in Settings → Providers.'), go);
  box.append(head, body, foot);
  back.append(box);
  document.body.append(back);
}

function openSettings() {
  if (document.querySelector('.settings')) return;
  closePop();
  const back = h('div', 'modal-back'), box = h('div', 'modal settings');
  const close = () => { back.classList.add('out'); document.removeEventListener('keydown', key, true); setTimeout(() => back.remove(), 160); };
  const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  document.addEventListener('keydown', key, true);
  back.onmousedown = (e) => { if (e.target === back) close(); };

  const head = h('div', 'set-head');
  const x = h('button', 'icon-btn'); x.title = 'Close'; x.append(icon('x', 16)); x.onclick = close;
  head.append(h('h3', '', 'Settings'), x);
  const body = h('div', 'set-body');

  const section = (title) => { body.append(h('div', 'set-section', title)); };
  const row = (title, desc, control) => {
    const r = h('div', 'set-row'), t = h('div', 'set-text');
    t.append(h('b', '', title)); if (desc) t.append(h('span', '', desc));
    r.append(t, control); body.append(r); return r;
  };
  const seg = (options, value, onPick) => {
    const s = h('div', 'seg set-seg');
    options.forEach(([id, label, ic]) => {
      const b = h('button', 'seg-btn' + (id === value ? ' on' : ''));
      if (ic) b.append(typeof ic === 'string' ? icon(ic, 14) : ic);
      b.append(h('span', '', label));
      b.onclick = () => { s.querySelectorAll('.seg-btn').forEach((o) => o.classList.remove('on')); b.classList.add('on'); onPick(id); };
      s.append(b);
    });
    return s;
  };
  const toggle = (value, onChange) => {
    const t = h('button', 'toggle' + (value ? ' on' : '')); t.setAttribute('role', 'switch'); t.append(h('i'));
    t.onclick = () => { t.classList.toggle('on'); onChange(t.classList.contains('on')); };
    return t;
  };

  section('Providers');
  const pv = h('div', 'pv-list'); body.append(pv); providerSetup(pv);

  section('Defaults for new chats');
  row('AI', 'Which provider new chats start with.',
    seg(providers.map((p) => [p.id, p.label, mark(p)]), settings.provider || provider.id, (id) => { settings.provider = id; saveSettings(); }));
  const folderBtn = h('button', 'set-link');
  const drawFolder = () => { folderBtn.textContent = settings.folder ? base(settings.folder) : 'Choose folder…'; folderBtn.title = settings.folder || ''; };
  drawFolder();
  folderBtn.onclick = async () => {
    const dir = await window.hub.pickFolder(settings.folder || home);
    if (dir) { settings.folder = dir; settings.workspace = 'folder'; saveSettings(); drawFolder(); wsSeg.replaceWith(wsSeg = makeWs()); }
  };
  const makeWs = () => seg([['local', 'Local', 'monitor'], ['folder', 'Folder', 'folder']], settings.workspace, async (id) => {
    if (id === 'folder' && !settings.folder) { folderBtn.click(); return; }
    settings.workspace = id; saveSettings();
  });
  let wsSeg = makeWs();
  const wsWrap = h('div', 'set-inline'); wsWrap.append(wsSeg, folderBtn);
  row('Workspace', 'Local has full access to your whole PC. Folder limits edits to one folder.', wsWrap);
  row('Remember last model', 'Reopen each AI on the model you used last.', toggle(settings.rememberModel, (v) => { settings.rememberModel = v; saveSettings(); }));

  section('Chat');
  row('Enter to send', 'Off: Enter adds a new line and Ctrl+Enter sends.', toggle(settings.enterToSend, (v) => { settings.enterToSend = v; saveSettings(); }));
  row('Show thought process', 'Expand the AI’s thinking by default.', toggle(settings.expandThinking, (v) => { settings.expandThinking = v; saveSettings(); }));
  row('Text size', '', seg([['small', 'Small'], ['default', 'Default'], ['large', 'Large']], settings.textSize, (id) => { settings.textSize = id; saveSettings(); }));

  section('Data');
  const wipe = h('button', 'btn danger-outline', 'Delete all chats');
  wipe.onclick = async () => {
    const list = await window.hub.chats.list();
    if (!list.length) { toast('No chats to delete', 'check'); return; }
    close();
    if (!await ask({ title: `Delete all ${list.length} chats?`, body: 'Every chat in your history will be permanently removed.', ok: 'Delete all', danger: true })) return;
    for (const c of list) await window.hub.chats.remove(c.id);
    if (!busy) newChat(); else renderHistory();
    toast('All chats deleted', 'trash');
  };
  row('Chat history', 'Stored only on this PC.', wipe);

  const foot = h('div', 'set-foot');
  const brand = h('div', 'set-brand'); const lg = h('img'); lg.src = 'logo.svg'; lg.alt = '';
  brand.append(lg, h('b', '', 'Onyx'), h('span', '', 'Version 1.0'));
  foot.append(brand, h('span', '', 'Ctrl , opens settings'));

  box.append(head, body, foot);
  back.append(box);
  document.body.append(back);
}
$('settingsBtn').onclick = openSettings;

function toast(text, ic = 'check') {
  const t = h('div', 'toast'); t.append(icon(ic, 14), h('span', '', text));
  $('toasts').append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 250); }, 2200);
}

$('modelChip').onclick = () => openPop($('modelChip'), modelPop, 380);
$('effortChip').onclick = () => openPop($('effortChip'), effortPop, 320);
$('workspaceChip').onclick = () => openPop($('workspaceChip'), workspacePop, 360);

// --- Usage limits -------------------------------------------------------------
function resetsIn(ms) {
  const d = ms - Date.now();
  if (d <= 0) return 'resets now';
  const hrs = Math.floor(d / 36e5), days = Math.floor(hrs / 24);
  return days ? `resets in ${days}d ${hrs % 24}h` : hrs ? `resets in ${hrs}h ${Math.floor(d / 6e4) % 60}m` : `resets in ${Math.ceil(d / 6e4)}m`;
}
let usageReq = 0;
async function loadUsage() {
  const p = provider, req = ++usageReq;
  renderMeter(null);
  if (!p.installed) return;
  const r = await window.hub.limits(p.id);
  if (req !== usageReq) return;
  usageCache[p.id] = r;
  renderMeter(r);
  if (popAnchor === $('usageBtn')) { $('pop').innerHTML = ''; usagePop($('pop')); }
}
function renderMeter(r) {
  const pcts = ((r && r.items) || []).map((i) => i.pct).filter((n) => typeof n === 'number');
  const max = pcts.length ? Math.max(...pcts) : null;
  const ring = $('usageRing');
  ring.style.setProperty('--p', max == null ? 0 : Math.min(100, max));
  ring.classList.toggle('hot', max != null && max >= 80);
  $('usageText').textContent = max == null ? 'Usage' : `${max}%`;
}
function usagePop(pop) {
  const p = provider, r = usageCache[p.id];
  const head = h('div', 'pop-title row');
  head.append(h('span', '', `${p.label} usage`));
  const rf = h('button', 'icon-btn'); rf.title = 'Refresh'; rf.append(icon('refresh', 14)); rf.onclick = loadUsage;
  head.append(rf);
  pop.append(head);
  const body = h('div', 'usage');
  if (!p.installed) body.append(h('div', 'muted', `${p.label} is not installed.`));
  else if (!r) body.append(h('div', 'muted', 'Loading…'));
  else {
    if (r.plan) body.append(h('div', 'plan', `${r.plan[0].toUpperCase() + r.plan.slice(1)} plan`));
    if (r.reached) body.append(h('div', 'err', `Limit reached: ${r.reached}`));
    for (const it of r.items || []) {
      const el = h('div', 'limit'), row = h('div', 'limit-row');
      row.append(h('span', '', it.label), h('b', '', typeof it.pct === 'number' ? `${it.pct}%` : it.detail || ''));
      el.append(row);
      if (typeof it.pct === 'number') {
        const bar = h('div', 'bar'), fill = h('i', it.pct >= 90 ? 'bad' : it.pct >= 70 ? 'warn' : '');
        fill.style.width = Math.min(100, it.pct) + '%'; bar.append(fill); el.append(bar);
      }
      if (it.resetsAt) el.append(h('small', '', resetsIn(it.resetsAt)));
      body.append(el);
    }
  }
  pop.append(body);
}
$('usageBtn').onclick = () => openPop($('usageBtn'), usagePop, 300);

// --- Slash-command menu -------------------------------------------------------
function updateMenu() {
  const m = /^\/(\S*)$/.exec($('in').value);
  menuItems = m ? commands.filter((c) => c.name.toLowerCase().includes(m[1].toLowerCase())) : [];
  menuIndex = Math.min(menuIndex, Math.max(menuItems.length - 1, 0));
  const menu = $('menu');
  menu.innerHTML = '';
  menu.hidden = !menuItems.length;
  if (menuItems.length) menu.append(h('div', 'pop-title', 'Commands'));
  menuItems.forEach((c, i) => {
    const d = h('div', 'cmd' + (i === menuIndex ? ' sel' : ''));
    d.append(h('b', '', '/' + c.name), h('small', '', c.description));
    d.onmousedown = (e) => { e.preventDefault(); pick(i); };
    menu.append(d);
  });
  const sel = menu.querySelector('.cmd.sel');
  if (sel) sel.scrollIntoView({ block: 'nearest' });
}
function pick(i) {
  $('in').value = '/' + menuItems[i].name + ' ';
  menuItems = []; $('menu').hidden = true; $('in').focus();
}
// Grow the message box with its content (capped by max-height in CSS).
function autosize() {
  const t = $('in'); t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px';
  // Light up the send button only when there is something to send.
  t.closest('.composer').classList.toggle('ready', !!t.value.trim() || attachments.length > 0);
}
$('in').oninput = () => { menuIndex = 0; updateMenu(); autosize(); };

function runLocal(name, arg) {
  if (name === 'new' || name === 'clear') { if (!busy) newChat(); return; }
  if (name === 'help') {
    note(commands.map((c) => `/${c.name} — ${c.description}`).join('\n') +
      (provider.id === 'codex' ? '\n\n(The ChatGPT CLI has no slash commands in this mode.)' : ''));
    return;
  }
  if (name === 'model') {
    const q = arg.toLowerCase();
    const m = q && (provider.models.find((x) => x.id.toLowerCase() === q) ||
      provider.models.find((x) => x.label.toLowerCase().includes(q) || x.id.toLowerCase().includes(q)));
    if (!m) { note(`No ${provider.label} model matches "${arg}".`); return; }
    setModel(m.id); note(`Model: ${m.label}`);
    return;
  }
  if (name === 'effort') {
    const lv = efforts();
    if (!lv.length) { note('This model has no thinking levels.'); return; }
    const e = lv.find((x) => x.id === arg.toLowerCase());
    if (!e) { note(`Levels: ${lv.map((x) => x.id).join(', ')}`); return; }
    effort = e.id; chat.effort = e.id; renderChips(); note(`Thinking level: ${e.id}`);
  }
}

// --- Sending ------------------------------------------------------------------
// Text of the conversation so far, for a provider that has no session in this chat yet.
function transcript() {
  return chat.messages.filter((m) => m.role === 'user' || m.role === 'assistant').map((m) => m.role === 'user'
    ? `User: ${m.text}${m.files && m.files.length ? `\n[Attached files: ${m.files.join(', ')}]` : ''}`
    : `Assistant: ${m.events.filter((e) => e.kind === 'text').map((e) => e.text).join('\n\n')}`).join('\n\n');
}

function setBusy(b) {
  busy = b;
  const go = $('go');
  go.innerHTML = ''; go.append(icon(b ? 'stop' : 'up', 16));
  go.title = b ? 'Stop' : 'Send';
  go.classList.toggle('busy', b);
  document.querySelectorAll('.composer .chip').forEach((c) => { c.disabled = b; });
  if (b) closePop();
}

$('f').onsubmit = (e) => {
  e.preventDefault();
  if (busy) { window.hub.stop(); return; }
  const files = attachments.slice();
  const text = $('in').value.trim() || (files.length ? 'Take a look at the attached file' + (files.length > 1 ? 's.' : '.') : '');
  if (!text) return;
  $('menu').hidden = true;

  const slash = /^\/(\S+)\s*([\s\S]*)$/.exec(text);
  const cmd = slash && commands.find((c) => c.name === slash[1]);
  if (cmd && cmd.local) { $('in').value = ''; autosize(); runLocal(cmd.name, slash[2].trim()); return; }
  if (!provider.installed) { note(`${provider.label} is not installed.`); return; }

  const session = chat.sessions[provider.id];
  const prior = session ? '' : transcript();
  // With a CLI session the CLI remembers the conversation; otherwise replay it as context.
  // Provider commands are sent as-is.
  let prompt = cmd ? slash[2].trim() : prior ? `${prior}\n\nUser: ${text}` : text;
  // File workspace: tell the AI which file this chat is about (not shown in the chat).
  if (!cmd && workspace(chat) === 'file' && chat.file) prompt = `[Focus on this file: ${chat.file}]\n\n${prompt}`;
  if (files.length) prompt += `\n\n[Attached files - read them from disk:]\n${files.map((p) => `- ${p}`).join('\n')}`;
  const lv = efforts().some((x) => x.id === effort) ? effort : '';

  if (!chat.messages.length) { chat.title = clip(text.replace(/\s+/g, ' '), 50); $('log').innerHTML = ''; $('title').textContent = chat.title; }
  const userMsg = { role: 'user', text, files, at: Date.now() };
  attachments = []; renderAttachments();
  chat.messages.push(userMsg); renderMessage(userMsg);
  Object.assign(chat, { provider: provider.id, model: modelId, effort: lv });
  liveMsg = { role: 'assistant', provider: provider.id, events: [], status: 'running', at: Date.now(),
    model: [modelName(currentModel()), lv && `${lv} thinking`].filter(Boolean).join(' · '),
    tag: [provider.label, modelName(currentModel()), lv && `thinking: ${lv}`].filter(Boolean).join(' · ') };
  chat.messages.push(liveMsg);
  liveEl = renderMessage(liveMsg);
  $('in').value = ''; autosize(); $('scroll').scrollTop = 1e9;
  save();
  setBusy(true);
  window.hub.send({ provider: provider.id, model: modelId, effort: lv, prompt, cwd: chat.cwd, session, access: chat.access || 'read',
    command: cmd ? cmd.name : null });
};

$('in').onkeydown = (e) => {
  if (menuItems.length) {
    if (e.key === 'ArrowDown') { e.preventDefault(); menuIndex = (menuIndex + 1) % menuItems.length; updateMenu(); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); menuIndex = (menuIndex - 1 + menuItems.length) % menuItems.length; updateMenu(); return; }
    if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) { e.preventDefault(); pick(menuIndex); return; }
    if (e.key === 'Escape') { menuItems = []; $('menu').hidden = true; return; }
  }
  // Enter sends (or Ctrl+Enter when "Enter to send" is off in Settings).
  if (e.key === 'Enter' && !e.shiftKey && (settings.enterToSend || e.ctrlKey)) { e.preventDefault(); $('f').requestSubmit(); }
};
$('newChat').onclick = () => { if (!busy) newChat(); };
// Click the header title to rename the chat inline.
$('title').onclick = () => {
  if (!chat.messages.length || $('title').querySelector('input')) return;
  const input = h('input', 'title-edit'); input.value = chat.title; input.maxLength = 80;
  $('title').textContent = ''; $('title').append(input); input.focus(); input.select();
  let done = false;
  const finish = (keep) => {
    if (done) return; done = true;
    const v = input.value.trim();
    if (keep && v && v !== chat.title) { chat.title = v; save(); toast('Chat renamed', 'pencil'); }
    $('title').textContent = chat.title;
  };
  input.onkeydown = (e) => { if (e.key === 'Enter') finish(true); else if (e.key === 'Escape') finish(false); };
  input.onblur = () => finish(true);
};

// Floating "jump to latest" button when scrolled away from the bottom.
$('scroll').addEventListener('scroll', () => {
  const s = $('scroll');
  $('toBottom').classList.toggle('show', s.scrollHeight - s.scrollTop - s.clientHeight > 240);
});
$('toBottom').onclick = () => { $('scroll').scrollTop = 1e9; };

const toggleSide = () => document.body.classList.toggle('collapsed');
$('sideToggle').onclick = toggleSide;
$('sideOpen').onclick = toggleSide;
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('pop').hidden) { closePop(); return; }
  // Arrow keys move through the options of an open menu; Enter picks the focused one.
  if (!$('pop').hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    const opts = [...$('pop').querySelectorAll('.opt')];
    if (!opts.length) return;
    e.preventDefault();
    const i = opts.indexOf(document.activeElement);
    const next = i < 0 ? (e.key === 'ArrowDown' ? 0 : opts.length - 1) : (i + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
    opts[next].focus(); opts[next].scrollIntoView({ block: 'nearest' });
    return;
  }
  if (!e.ctrlKey && !e.metaKey) return;
  const k = e.key.toLowerCase();
  if (k === ',') { e.preventDefault(); openSettings(); return; }
  if (k === 'n') { e.preventDefault(); if (!busy) newChat(); }
  else if (k === 'b') { e.preventDefault(); toggleSide(); }
  else if (k === 'k') { e.preventDefault(); document.body.classList.remove('collapsed'); $('search').focus(); }
});

window.hub.onEvent((ev) => {
  if (!liveMsg) return;
  if (ev.kind === 'session') { chat.sessions[liveMsg.provider] = ev.id; return; }
  if (ev.kind === 'tool' && ev.output && ev.output.length > 6000) ev.output = ev.output.slice(0, 6000) + '\n…';
  liveMsg.events.push(ev);
  if (liveEl.isConnected) {
    const s = $('scroll'), atBottom = s.scrollHeight - s.scrollTop - s.clientHeight < 80;
    renderAssistant(liveMsg, liveEl);
    if (atBottom) s.scrollTop = 1e9;
  }
});
window.hub.onDone((code) => {
  if (!liveMsg) return;
  liveMsg.status = code === 'stopped' ? 'stopped' : code ? 'error' : 'done';
  if (liveEl.isConnected) renderAssistant(liveMsg, liveEl);
  liveMsg = null; liveEl = null;
  setBusy(false);
  save();
  loadUsage();
});

// --- Startup ------------------------------------------------------------------
$('sideToggle').append(icon('sidebar', 17));
$('settingsBtn').append(icon('gear', 17));
applySettings();
$('attachBtn').append(icon('clip', 16));
$('toBottom').append(icon('chevron', 16));
document.querySelector('.drop-ic').append(icon('upload', 24));
$('sideOpen').append(icon('sidebar', 17));
$('searchIc').append(icon('search', 14));
{ const ni = h('span', 'ni'); ni.append(icon('plus', 14)); $('newChat').append(ni, h('span', '', 'New chat'), h('kbd', '', 'Ctrl N')); }
setBusy(false);
{ // Shown while the CLIs are queried for their models (takes a few seconds).
  const boot = h('div', 'hero'), orb = h('div', 'orb'), img = h('img');
  img.src = 'logo.svg'; img.alt = ''; orb.append(img);
  boot.append(orb, h('h2', '', 'Onyx'), h('p', 'shimmer', 'Loading your AI providers'));
  $('log').append(boot);
}
Promise.all([window.hub.providers(), window.hub.home()]).then(([list, dir]) => {
  providers = list; home = dir;
  renderSideFoot();
  const preferred = list.find((p) => p.id === settings.provider && p.installed);
  selectProvider(preferred || list.find((p) => p.installed) || list[0], false);
  newChat();
  // First launch (or nothing set up yet): show the welcome / setup screen.
  if (!settings.onboarded || !list.some((p) => p.installed)) openWelcome();
});
