// Data layer. Currently backed by localStorage; swap these methods for fetch()
// calls to a real API (or GitHub Issues, Supabase, etc.) when going live.
(function () {
  const KEY = 'aihelp.issues.v1';
  const VOTES = 'aihelp.myvotes.v1';
  const read = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  let issues = read(KEY, null) || structuredClone(window.SEED_ISSUES);
  let myVotes = read(VOTES, {});
  const save = () => { write(KEY, issues); write(VOTES, myVotes); };
  const uid = () => Math.random().toString(36).slice(2, 10);

  window.Store = {
    all: () => issues,
    get: id => issues.find(i => i.id === id),
    create(data) {
      const issue = { id: uid(), status: 'open', votes: 0, replies: [], createdAt: Date.now(), ...data };
      issues.unshift(issue); save(); return issue;
    },
    update(id, patch) { Object.assign(this.get(id), patch); save(); },
    reply(id, author, body) {
      const issue = this.get(id);
      issue.replies.push({ id: uid(), author, body, createdAt: Date.now(), votes: 0 });
      if (issue.status === 'open') issue.status = 'progress';
      save();
    },
    accept(id, replyId) {
      const issue = this.get(id);
      issue.replies.forEach(r => (r.accepted = r.id === replyId));
      issue.status = 'solved'; save();
    },
    toggleVote(key, target) {
      myVotes[key] = !myVotes[key];
      target.votes += myVotes[key] ? 1 : -1; save();
    },
    hasVoted: key => !!myVotes[key],
    reset() { issues = structuredClone(window.SEED_ISSUES); myVotes = {}; save(); },
  };
})();
