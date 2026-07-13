# Advat

A fun social page for gamers — frontend demo only.

No backend, no Supabase. All data lives in `lib/mockData.js` and page-level
`useState`, so likes, follows, DM sends, etc. feel real but reset on refresh.

## Run it

```
npm install
npm run dev
```

## Pages

- `/feed` — posts + sponsored ad cards
- `/players` — searchable player directory
- `/flex` — your stats, flex cards, weekly leaderboard
- `/dm` — conversations + thread view
- `/notifications` — activity feed
- `/profile` — your profile, posts & flex tabs

## Restyle

Every color is a CSS variable in `app/globals.css` (`--accent`, `--accent-2`,
etc). Swap those to reskin the whole app in one place.
