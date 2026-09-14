# Dashboard 2

Interactive React/Vite implementation of the dashboard inside the user-selected [Clinexa reference](https://dribbble.com/shots/26892320-Healthcare-CRM-Dashboard-UI-Clinexa), adapted to Uplift AI content.

## Run

```sh
npm install
npm run dev
```

Open the localhost URL printed by Vite. `npm run build` creates the production bundle in `dist`; `npm run preview` serves it.

## Included

- Reference-matched desktop composition, pastel charts, icon navigation, and compact metric cards.
- Responsive dashboard and mobile navigation.
- Weekly/monthly/yearly chart periods, accessible bar tooltips, interactive distribution legend.
- Upcoming-content carousel and detail dialog, local review-status changes.
- Content search, status filters, CSV export, source-backed workspace views.

## Data

Content names, Uplift terminology, and headline counts come from previously captured Uplift AI/LunchLink workspace text. Historical source data is not refreshed automatically. Monthly chart series, content distribution, and demonstration scheduling states are illustrative. The app labels itself as a demo workspace. Changes persist only during the current session. This project has no backend, authentication, publishing API, or external mutations.

No images or layouts from Uplift's original website are used. The Clinexa reference is stored only in `.impeccable/references` for review and is not shipped in the app. Icons are Lucide and an authored Uplift-style mark. Inter is self-hosted from Fontsource. Upcoming-content portraits are locally stored demo avatars from Random User; their sources are recorded in `public/avatars/SOURCES.md`.

## Expanded workspace sections

The calendar now includes month, week, and agenda views; day selection; content-type filters; and a daily schedule. The library and social workspace include list/grid layouts, collections, status filters, sorting, selection, visible/selected CSV export, and local bulk review. A shared composer adds records across calendar and library. Keyword research includes difficulty filtering and topic-prefilled planning; AI visibility includes the captured baseline and sample monitored questions.

The 18 initial preview records include illustrative additions based on the source topic names. Library/calendar analytics count these records. The original dashboard headline metrics and research baselines remain historical source snapshots.
