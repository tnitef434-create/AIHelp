(function () {
  const T = window.TAXONOMY, S = window.Store;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const label = (list, id) => (list.find(x => x.id === id) || {}).label || id;
  const ago = t => { const m = Math.round((Date.now() - t) / 6e4); if (m < 60) return `${Math.max(m, 1)}m ago`; const h = Math.round(m / 60); if (h < 24) return `${h}h ago`; return `${Math.round(h / 24)}d ago`; };
  const repoName = url => url.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');
  const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '';

  // Filter state (synced to URL hash so filtered views are shareable)
  const state = { q: '', status: new Set(), category: null, tags: new Set(), urgency: new Set(), repoOnly: false, sort: 'new' };
  function toHash() {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.category) p.set('cat', state.category);
    if (state.status.size) p.set('status', [...state.status]);
    if (state.tags.size) p.set('tags', [...state.tags]);
    if (state.urgency.size) p.set('urg', [...state.urgency]);
    if (state.repoOnly) p.set('repo', '1');
    if (state.sort !== 'new') p.set('sort', state.sort);
    history.replaceState(null, '', p.toString() ? '#' + p : location.pathname);
  }
  function fromHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    const set = k => new Set((p.get(k) || '').split(',').filter(Boolean));
    Object.assign(state, { q: p.get('q') || '', category: p.get('cat'), status: set('status'), tags: set('tags'), urgency: set('urg'), repoOnly: p.get('repo') === '1', sort: p.get('sort') || 'new' });
    $('#search').value = state.q; $('#sort').value = state.sort; $('#repoOnly').checked = state.repoOnly;
  }

  function matches(i, skip) {
    const q = state.q.toLowerCase();
    if (q && ![i.title, i.body, i.author, i.repo, ...(i.tags || [])].join(' ').toLowerCase().includes(q)) return false;
    if (skip !== 'status' && state.status.size && !state.status.has(i.status)) return false;
    if (skip !== 'category' && state.category && i.category !== state.category) return false;
    if (state.urgency.size && !state.urgency.has(i.urgency)) return false;
    if (state.tags.size && ![...state.tags].every(t => (i.tags || []).includes(t))) return false;
    if (state.repoOnly && !i.repo) return false;
    return true;
  }

  function renderFilters() {
    const all = S.all();
    const chip = (group, id, text) => `<button class="chip ${state[group].has(id) ? 'on' : ''}" data-group="${group}" data-id="${esc(id)}">${esc(text)}</button>`;
    $('#statusFilters').innerHTML = T.statuses.map(s => chip('status', s.id, `${s.label} · ${all.filter(i => i.status === s.id && matches(i, 'status')).length}`)).join('');
    $('#urgencyFilters').innerHTML = T.urgencies.map(u => chip('urgency', u.id, u.label)).join('');
    const counts = {}; all.forEach(i => (i.tags || []).forEach(t => (counts[t] = (counts[t] || 0) + 1)));
    const tags = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 18).map(([t]) => t);
    state.tags.forEach(t => tags.includes(t) || tags.push(t));
    $('#tagFilters').innerHTML = tags.map(t => chip('tags', t, '#' + t)).join('');
    const catBtn = (id, text, n) => `<li><button class="${state.category === id ? 'on' : ''}" data-cat="${id ?? ''}"><span>${esc(text)}</span><span class="muted">${n}</span></button></li>`;
    $('#categoryFilters').innerHTML = catBtn(null, 'All categories', all.filter(i => matches(i, 'category')).length) +
      T.categories.map(c => catBtn(c.id, c.label, all.filter(i => i.category === c.id && matches(i, 'category')).length)).join('');
  }

  function renderList() {
    let items = S.all().filter(i => matches(i));
    const sorters = {
      new: (a, b) => b.createdAt - a.createdAt,
      votes: (a, b) => b.votes - a.votes,
      replies: (a, b) => b.replies.length - a.replies.length,
      unanswered: (a, b) => (a.replies.length ? 1 : 0) - (b.replies.length ? 1 : 0) || b.createdAt - a.createdAt,
    };
    items.sort(sorters[state.sort]);
    $('#resultCount').textContent = `${items.length} issue${items.length === 1 ? '' : 's'}`;
    $('#list').innerHTML = items.length ? items.map(card).join('') :
      `<div class="empty"><p>No issues match these filters.</p><button class="btn btn-primary" data-open="new">Be the first to ask</button></div>`;
  }

  const statusBadge = s => `<span class="badge s-${s}">${label(T.statuses, s)}</span>`;
  const voteBox = (key, n) => `<div class="vote"><button class="${S.hasVoted(key) ? 'on' : ''}" data-vote="${key}" aria-label="Upvote">▲</button><b>${n}</b></div>`;
  function card(i) {
    return `<article class="card" data-id="${i.id}">
      ${voteBox(i.id, i.votes)}
      <div>
        <h2>${esc(i.title)}</h2>
        <p class="excerpt">${esc(i.body)}</p>
        <div class="meta">
          ${statusBadge(i.status)}
          ${i.urgency === 'high' ? '<span class="badge u-high">Urgent</span>' : ''}
          <span class="cat">${esc(label(T.categories, i.category))}</span>
          ${(i.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join('')}
          ${safeUrl(i.repo) ? `<a class="repo" href="${esc(i.repo)}" target="_blank" rel="noopener" data-stop>⌥ ${esc(repoName(i.repo))}</a>` : ''}
          <span>💬 ${i.replies.length}</span>
          <span>${esc(i.author)} · ${ago(i.createdAt)}</span>
        </div>
      </div></article>`;
  }

  function openDetail(id) {
    const i = S.get(id); if (!i) return;
    $('#detail').innerHTML = `
      <header class="dialog-head"><div class="meta">${statusBadge(i.status)} <span class="cat">${esc(label(T.categories, i.category))}</span> <span>${esc(i.author)} · ${ago(i.createdAt)}</span></div>
        <button class="btn btn-ghost icon" data-close>✕</button></header>
      <h2 style="margin:0">${esc(i.title)}</h2>
      <div class="links">
        ${safeUrl(i.repo) ? `<a class="btn" href="${esc(i.repo)}" target="_blank" rel="noopener">⌥ ${esc(repoName(i.repo))}</a>` : ''}
        ${safeUrl(i.site) ? `<a class="btn" href="${esc(i.site)}" target="_blank" rel="noopener">🌐 Live site</a>` : ''}
        ${i.status !== 'solved' ? `<button class="btn" data-solve="${i.id}">Mark solved</button>` : `<button class="btn" data-reopen="${i.id}">Reopen</button>`}
      </div>
      <div class="body">${esc(i.body)}</div>
      <div class="meta">${(i.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</div>
      <h3 style="margin:8px 0 0">${i.replies.length} repl${i.replies.length === 1 ? 'y' : 'ies'}</h3>
      ${i.replies.map(r => `<div class="reply ${r.accepted ? 'accepted' : ''}">
        <div class="reply-head"><span><b>${esc(r.author)}</b> · ${ago(r.createdAt)} ${r.accepted ? '· <span class="badge s-solved">✓ Accepted</span>' : ''}</span>
          <span>${r.accepted ? '' : `<button class="chip" data-accept="${r.id}" data-issue="${i.id}">Accept</button>`}
          <button class="chip ${S.hasVoted(i.id + ':' + r.id) ? 'on' : ''}" data-vote="${i.id}:${r.id}">▲ ${r.votes}</button></span></div>
        <div class="body">${esc(r.body)}</div></div>`).join('')}
      <form id="replyForm" data-issue="${i.id}" style="padding:0">
        <label>Your answer <textarea name="body" rows="4" required placeholder="Share a fix, a pointer, or a question…"></textarea></label>
        <div class="row"><input name="author" placeholder="Your name (optional)" maxlength="40" /><button class="btn btn-primary">Post reply</button></div>
      </form>`;
    const d = $('#detailDialog'); if (!d.open) d.showModal();
  }

  function rerender() { renderFilters(); renderList(); toHash(); }

  // --- events ---
  document.addEventListener('click', e => {
    const t = e.target.closest('button, a, .card'); if (!t) return;
    if (t.dataset.stop !== undefined) return;
    if (t.dataset.open === 'new') return $('#newDialog').showModal();
    if (t.dataset.close !== undefined) return t.closest('dialog').close();
    if (t.dataset.nav === 'home') { e.preventDefault(); Object.assign(state, { q: '', category: null, status: new Set(), tags: new Set(), urgency: new Set(), repoOnly: false }); fromHashReset(); return; }
    if (t.dataset.group) { const s = state[t.dataset.group]; s.has(t.dataset.id) ? s.delete(t.dataset.id) : s.add(t.dataset.id); return rerender(); }
    if ('cat' in t.dataset) { state.category = t.dataset.cat || null; return rerender(); }
    if (t.dataset.vote) {
      e.stopPropagation();
      const [iid, rid] = t.dataset.vote.split(':'); const issue = S.get(iid);
      S.toggleVote(t.dataset.vote, rid ? issue.replies.find(r => r.id === rid) : issue);
      renderList(); if ($('#detailDialog').open) openDetail(iid); return;
    }
    if (t.dataset.accept) { S.accept(t.dataset.issue, t.dataset.accept); openDetail(t.dataset.issue); return rerender(); }
    if (t.dataset.solve) { S.update(t.dataset.solve, { status: 'solved' }); openDetail(t.dataset.solve); return rerender(); }
    if (t.dataset.reopen) { S.update(t.dataset.reopen, { status: 'open' }); openDetail(t.dataset.reopen); return rerender(); }
    if (t.classList.contains('card')) return openDetail(t.dataset.id);
  });
  function fromHashReset() { $('#search').value = ''; $('#repoOnly').checked = false; rerender(); }

  document.addEventListener('submit', e => {
    if (e.target.id === 'replyForm') {
      e.preventDefault(); const f = new FormData(e.target), id = e.target.dataset.issue;
      S.reply(id, f.get('author').trim() || 'Anonymous', f.get('body').trim()); openDetail(id); rerender();
    }
  });
  $('#newForm').addEventListener('submit', e => {
    if (e.submitter?.value !== 'submit') return;
    const f = new FormData(e.target);
    const issue = S.create({
      title: f.get('title').trim(), category: f.get('category'), urgency: f.get('urgency'),
      repo: f.get('repo').trim(), site: f.get('site').trim(), body: f.get('body').trim(),
      author: f.get('author').trim() || 'Anonymous',
      tags: f.get('tags').split(',').map(t => t.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-')).filter(Boolean).slice(0, 6),
    });
    e.target.reset(); rerender(); setTimeout(() => openDetail(issue.id), 0);
  });
  let qTimer; $('#search').addEventListener('input', e => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.q = e.target.value.trim(); rerender(); }, 150); });
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; rerender(); });
  $('#repoOnly').addEventListener('change', e => { state.repoOnly = e.target.checked; rerender(); });
  $('#clearFilters').addEventListener('click', () => { Object.assign(state, { category: null, status: new Set(), tags: new Set(), urgency: new Set(), repoOnly: false }); $('#repoOnly').checked = false; rerender(); });
  $('#resetData').addEventListener('click', e => { e.preventDefault(); if (confirm('Reset to demo data?')) { S.reset(); rerender(); } });

  // theme
  const root = document.documentElement;
  const setTheme = t => { root.dataset.theme = t; try { localStorage.setItem('aihelp.theme', t); } catch {} };
  let saved; try { saved = localStorage.getItem('aihelp.theme'); } catch {}
  root.dataset.theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  $('#themeToggle').addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  // init
  $('#catSelect').innerHTML = T.categories.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
  $('#urgSelect').innerHTML = T.urgencies.map(u => `<option value="${u.id}" ${u.id === 'normal' ? 'selected' : ''}>${u.label}</option>`).join('');
  fromHash(); rerender();
})();
