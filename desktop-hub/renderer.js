const $ = (id) => document.getElementById(id);
let providers = [], current = null, busy = false, out = null;

function history() {
  // CLIs are stateless per call, so replay the visible conversation as context.
  return [...$('log').querySelectorAll('.msg')].map((m) =>
    (m.classList.contains('user') ? 'User: ' : 'Assistant: ') + m.dataset.text).join('\n\n');
}

function add(cls, text, who) {
  const d = document.createElement('div');
  d.className = 'msg ' + cls; d.dataset.text = text;
  if (who) { const b = document.createElement('b'); b.textContent = who; d.append(b); }
  const s = document.createElement('span'); s.textContent = text; d.append(s);
  $('log').append(d); $('log').scrollTop = 1e9;
  return d;
}

function select(p) {
  current = p;
  document.querySelectorAll('.prov').forEach((el) => el.classList.toggle('active', el.dataset.id === p.id));
  $('model').innerHTML = '';
  p.models.forEach((m) => $('model').append(new Option(m, m)));
}

window.hub.providers().then((list) => {
  providers = list;
  list.forEach((p) => {
    const el = document.createElement('div');
    el.className = 'prov' + (p.installed ? '' : ' off'); el.dataset.id = p.id;
    el.innerHTML = `${p.label}<small>${p.installed ? 'installed' : 'not found in PATH'}</small>`;
    el.onclick = () => select(p);
    $('provs').append(el);
  });
  select(list.find((p) => p.installed) || list[0]);
});

$('f').onsubmit = (e) => {
  e.preventDefault();
  if (busy) { window.hub.stop(); return; }
  const text = $('in').value.trim();
  if (!text) return;
  const prior = history();
  add('user', text); $('in').value = '';
  const prompt = prior ? `${prior}\n\nUser: ${text}` : text;
  out = add('ai', '', `${current.label} · ${$('model').value}`);
  busy = true; $('go').textContent = 'Stop';
  window.hub.send({ provider: current.id, model: $('model').value, prompt });
};
$('in').onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('f').requestSubmit(); } };
$('clear').onclick = () => { $('log').innerHTML = ''; };

window.hub.onChunk((t) => {
  out.dataset.text += t; out.querySelector('span').textContent = out.dataset.text; $('log').scrollTop = 1e9;
});
window.hub.onDone(() => { busy = false; $('go').textContent = 'Send'; out.dataset.text = out.dataset.text.trim(); });
