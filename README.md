# AIHelp — Community Help Board (concept)

A static prototype of a community help site: people post problems with their site or project, link their GitHub repo / live site, tag it, and others reply with help.

**Features:** post issues · GitHub + live-site links · categories, status, urgency, tag filters · search · sort · upvotes · replies · accept an answer / mark solved · shareable filtered URLs · dark mode · mobile layout.

## Run
No build step. Open `index.html`, or serve it:
```
python3 -m http.server 8000
```
Works on GitHub Pages as-is.

## Structure
- `js/data.js` — categories/statuses/urgencies + demo issues (edit to change filters)
- `js/store.js` — data layer (localStorage for now)
- `js/app.js` — UI, filtering, rendering

## Going real
Replace the methods in `js/store.js` with API calls (e.g. Supabase, Firebase, or your own backend), and add accounts — GitHub OAuth fits naturally since users already link repos.

## Live demo
https://claude.ai/artifact/R5tGPs9DXNtpzkzUV5Zrh3
