# Advat

A fun social page — frontend demo only.

No backend, no Supabase. All data lives in `lib/mockData.js` and page-level
`useState`, so likes, follows, DM sends, etc. feel real but reset on refresh.

## Run it

```
npm install
npm run dev
```

## Pages (UI language: Swahili)

- `/feed` — story strip, posts + sponsored ad cards
- `/people` — searchable player directory with vibe filter chips
- `/flex` — your stats, flex cards, weekly leaderboard
- `/dm` — conversations + thread view
- `/notifications` — activity feed
- `/profile` — your profile, posts & flex tabs

## What changed in this pass

Pages were reading as flat/empty, so on top of the language swap:
- Added a gradient "story ring" (`.ring` in globals.css) reused on avatars across Feed, People, DM, Flex leaderboard, TopBar, and Profile
- Post media placeholders got a dot texture + floating tag chip instead of a flat gradient box
- Added a horizontally scrolling story strip to the top of the feed
- Added vibe filter chips to `/people`
- Textured the profile cover and gave cards a soft shadow so they lift off the background

## Restyle

Every color is a CSS variable in `app/globals.css` (`--accent`, `--accent-2`,
etc). Swap those to reskin the whole app in one place.
