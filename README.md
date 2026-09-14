# Uplift AI · Content Workspace

React/Vite dashboard following the user-selected [Inkwise reference](https://dribbble.com/shots/27222028-UI-UX-Design-Document-Editor-Dashboard-Inkwise), populated with Uplift AI/LunchLink content.

## Run

```sh
npm install
npm run dev
```

Open the localhost URL printed by Vite. `npm run build` creates `dist`; `npm run preview` serves that build.

## Design and implementation

- `src/InkwiseDashboard.jsx` is the single home dashboard: recent documents, content table, activity feed, and semicircular workspace overview.
- `src/inkwise.css` owns the shell and home. `src/typography.css` defines readable type roles: 16px content, 14px metadata and controls, 20px section headings, and 28–32px page titles.
- `src/workspace.css` styles the library, social content, calendar, research, settings, connections, notifications, and dialogs inside `.workspace-view` boundaries.
- The periwinkle ring mark, document previews, white controls, and cool gray panels follow the selected design. The library shares the home document-preview component.
- Previous dashboard code and styles are preserved in `.impeccable/archive/` and are not imported. Do not reconnect them; follow `AGENTS.md`.

## Features

Content search, date/status filters, pagination, list/grid library layouts, collections, sorting, bulk review, CSV export, and a shared content composer. The calendar supports month/week/agenda views and day selection. Keyword research supports search, difficulty filtering, and topic-prefilled planning. AI visibility, settings, and connections display source snapshots.

## Data and assets

Content names and terminology come from captured Uplift AI/LunchLink workspace text. The 18 initial records include illustrative additions and schedules. Library/calendar counts derive from those local records. Research figures and headline workspace metrics are historical snapshots. Changes last for the browser session; this preview has no backend or live publishing integration.

No original Uplift website images or layouts are used. Inter is self-hosted; icons are Lucide. Miniature document artwork is generated from local content using HTML/CSS and is hidden from assistive technology; its tiny print is illustration, not interface text.

## Validation

Production build and browser checks cover home, library search and layouts, calendar modes, research, settings, and dialogs. Desktop, the user's 934px viewport, and 390px mobile layouts were inspected. Dense tables and calendars scroll within their panels. Latest evidence is in `.impeccable/review/`; see `current-finish-review.md` for the current review.

## Dark mode

Use the sun/moon switch beside notifications to compare themes. Settings → Appearance provides Light, Dark, and System. Theme choice persists in this browser and syncs across tabs; content edits remain session-only. The initial theme follows the system and is applied before the first render. Theme tokens live in `src/inkwise.css`, with operational components still scoped in `src/workspace.css`.
