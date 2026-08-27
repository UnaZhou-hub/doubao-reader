# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**豆包的识字之旅** — A gamified Chinese character learning app for a child named Doubao, themed around Ultraman heroes. Children earn Ultraman level upgrades, collectible cards, and achievement badges by learning characters and passing quizzes.

## Running the App

No build step. Serve the root directory with any static server:

```bash
python -m http.server 8000
# Then open http://localhost:8000
```

Deployment is via Netlify (auto-deploys on `git push origin main`). No build command or publish directory configuration needed beyond connecting the repo.

## Architecture

Pure vanilla JavaScript — no bundler, framework, or package manager. Three source files:

- **`js/storage.js`** — Data layer: localStorage persistence, all static data (card definitions, badge definitions, hero configs), and the `Storage` object that owns all app state.
- **`js/app.js`** — UI layer: page switching, event binding, rendering, animations, quiz logic. Calls into `Storage` for all reads/writes.
- **`css/style.css`** — All styling including SVG-based card rendering, level-up animations, and hero-specific color themes.
- **`index.html`** — App shell with 4 page sections (`record`, `wordbank`, `test`, `achievement`) and modal overlays. Loads `storage.js`, then `app.js`.

## Data Storage

All data lives in the browser's localStorage under the key `doubao_data`, as one JSON blob. Storage is per-device — there is no cloud sync, so the export/import buttons on the 百宝箱 page are the only way to move data between devices or recover from a cleared browser.

The `Storage.data` object is the single source of truth in memory:

```javascript
Storage.data = {
  wordBank: [],       // learned characters
  records: {},        // test history keyed by date
  poems: [],          // memorized poems
  profile: { ... },   // level, cards, badges, streaks
  settings: { ... }
}
```

`Storage.saveAll()` writes it to localStorage; `Storage.init()` reads it back on startup. When `doubao_data` is missing, `init()` falls back in order to `doubao_backup` (the snapshot the old Supabase version left behind) and then `data.json` (a snapshot committed to the repo), writes whichever it found to `doubao_data`, and sets `Storage.restoredFrom` so the UI can say where the data came from.

## Key Domain Concepts

**Ultraman Level System** (5 tiers based on total characters learned):
- 捷德 (Geed): 0–199
- 银河 (Ginga): 200–299
- 赛罗 (Zero): 300–399
- 艾斯 (Ace): 400–599
- 奥特之父 (Father of Ultra): 600+

**Card Acquisition Rules:**
- Perfect test score (100%) → 1 random card per day max (enforced by `lastCardDate`)
- Every 100 characters added → 1 card (no daily limit)

**Card System:** 43 total cards (21 skill, 12 weapon) with 4 rarity tiers (Common 50%, Rare 30%, Epic 15%, Legendary 5%), plus 10 badge achievements with unlock conditions.

## Page Structure

The app has 4 pages switched via bottom navigation (`.nav-btn[data-page]`):
1. **record** — Add new characters, view recent words
2. **wordbank** — Search/browse all learned characters, export/import data
3. **test** — Quiz mode (5/10/20 questions), results with card awards
4. **achievement** — Hero card, level progress, card collection grids, badges

## Requirements Document

`req.md` contains the full feature specification including exact card lists, badge unlock conditions, rarity weights, and color schemes. Consult it when implementing new features.
