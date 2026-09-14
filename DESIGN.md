---
name: "Uplift AI Dashboard"
description: "The selected Inkwise document dashboard composition with Uplift AI content operations."
colors:
  ink: "#303136"
  supporting: "#6b7180"
  purple: "#7485e8"
  primary-action: "#5a6bc4"
  primary-hover: "#5668c0"
  navigation: "#7788e8"
  canvas: "#eff1f6"
  panel: "#f7f8fb"
  white: "#ffffff"
  line: "#eceef3"
  search: "#fafbfe"
  gauge-blue: "#7e8ee6"
  gauge-orange: "#efbd85"
  gauge-green: "#a0d68e"
  scheduled-fill: "#edf0fa"
  scheduled-ink: "#5266b4"
  published-fill: "#e7f4df"
  published-ink: "#416f31"
  review-fill: "#fbefdf"
  review-ink: "#94662d"
typography:
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.8px"
  title:
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.25px"
  body:
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  document-title:
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.15px"
  metadata:
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  gauge:
    fontSize: "32px"
    fontWeight: 500
    letterSpacing: "-0.7px"
rounded:
  status: "3px"
  square: "7px"
  preview: "8px"
  document: "9px"
  feed: "10px"
  action: "11px"
  field: "12px"
  document-group: "15px"
  mobile-panel: "18px"
  panel: "23px"
  circle: "50%"
spacing:
  tight: "7px"
  compact: "10px"
  medium: "15px"
  gutter: "24px"
  panel-inline: "22px"
  panel-block: "21px"
components:
  button-primary:
    backgroundColor: "{colors.primary-action}"
    textColor: "{colors.white}"
    rounded: "{rounded.action}"
    padding: "10px 17px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "#686a75"
    rounded: "{rounded.action}"
    padding: "10px 15px"
    height: "44px"
  input-search:
    backgroundColor: "{colors.search}"
    rounded: "{rounded.field}"
    padding: "0 14px"
    height: "48px"
    width: "315px"
  navigation-active:
    backgroundColor: "{colors.navigation}"
    textColor: "{colors.white}"
    rounded: "{rounded.field}"
    size: "44px"
  status-scheduled:
    backgroundColor: "{colors.scheduled-fill}"
    textColor: "{colors.scheduled-ink}"
    rounded: "{rounded.status}"
    padding: "4px 6px"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
    padding: "21px 22px"
  document-card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.document}"
    padding: "0 0 4px"
  activity-card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.feed}"
    padding: "18px 14px"
---

# Design System: Uplift AI Dashboard

## Overview

**Creative North Star: "The selected Inkwise document workspace"**

This system records the implemented React and Vite dashboard, following the user-pinned Inkwise cover composition with Uplift AI product content. Its cool gray canvas, near-white panels, periwinkle navigation, readable Inter typography, and miniature document previews establish a quiet working surface. The reference determines the visual hierarchy; Uplift AI supplies the terminology and LunchLink workspace content.

The home view pairs a broad content column with a narrower activity and setup column. The interface stays flat and softly rounded, with white nested surfaces and fine rules organizing dense information. The selected authority is the [Inkwise dashboard reference](https://dribbble.com/shots/27222028-UI-UX-Design-Document-Editor-Dashboard-Inkwise), preserved in `.impeccable/references/inkwise-cover.png` and `inkwise.png`. The user’s later readability request establishes larger shared type roles throughout every section. The eight-node periwinkle ring is the active mark.

**Key Characteristics:**

- A white vertical icon rail beside a cool gray working canvas.
- Four miniature document previews above a six-row content table.
- A compact activity feed and a three-color semicircular setup gauge.
- Soft rectangular controls, restrained shadows, and responsive contained scrolling.

## Colors

### Primary

Periwinkle identifies the active navigation and operational actions. The main New content action uses the deeper reviewed primary-action tone so its white label remains distinct. Keep this distinction when extending the shell.

### Secondary

Blue, orange, and green divide the setup gauge and identify the three linked overview counts. Scheduled, published, and review status chips pair pale fills with darker category-specific text. The small AI shortcut uses a warm peach-to-mauve gradient; this is a local accent rather than the page background.

### Neutral

Cool gray forms the canvas; near-white defines panels; white defines document groups, activity cards, search-adjacent controls, and the navigation rail. Dark ink establishes headings and content names, reviewed slate supports dates and table labels, and pale lines divide rows. Existing content sections retain their darker section-muted ink and category-specific pastels.

**The Labeled Data Rule.** Pair status and gauge colors with text; preserve the source snapshot, sample schedule, and session-only disclosures.

## Typography

Inter is loaded locally in regular, medium, and semibold weights, with the platform sans-serif stack as fallback. Shared roles in `src/typography.css` are normative: content is 16px, metadata and controls are 14px, section headings are 20px, and page titles are 32px on desktop and 28px at 700px and below. These reading roles do not shrink on mobile. The home setup value is 32px; operational summary values are 28px (26px at 600px and below). Calendar period/date displays and dialog titles retain their distinct 22–28px hierarchy.

Home document titles, table names, library titles, and calendar event titles use the body role and wrap as needed. Metadata wraps rather than forcing the page wider. Body and document titles use a 1.5 line height; home section headings use 1.4 and page titles use 1.25. Section titles are medium or semibold. Miniature paper text at roughly 3–6px is permitted only inside the aria-hidden `DocumentPreview` artwork, never as readable interface copy.

**The Reading Roles Rule.** Keep content at 16px and supporting text at 14px across breakpoints; use local scrolling for dense data instead of shrinking text.

## Layout

The default desktop shell combines a sticky 76px white rail with a flexible main region capped at 1800px, a 24px gutter, and 24px right inset. A search header of 89px precedes the greeting and creation toolbar. The home grid uses a 2.74:1 column ratio with a right-column minimum of 280px and a 10px gap. Four equal document previews occupy a shared white group above the six-row table; activity cards and the setup gauge occupy the right column. Panels use 21px vertical and 22px horizontal padding by default.

- At 1550px and above, the rail becomes 82px, the shell gap 28px, the right inset 32px, and the header 98px. Shared type overrides preserve the same readable roles.
- At 1200px and below, the home content becomes one column and its activity and overview panels share a two-column row beneath it. The toolbar wraps below the greeting as needed; table channels remain visible.
- At 700px and below, 16px side insets and 80px bottom space accommodate fixed navigation. Recent previews become two columns; activity and setup panels stack. The home table keeps a 740px minimum inside its positioned horizontal scroll wrapper. The body minimum is 320px. Toolbar controls wrap while retaining 14px labels and 44px action heights.
- Desktop navigation can expand to 205px with visible labels. At desktop heights of 850px or less, rail spacing tightens. Mobile uses a 62px rounded bar inset 10px from each side and 9px from the bottom; More opens a labeled two-column menu above it.

The only mounted home is `src/InkwiseDashboard.jsx`. `src/main.jsx` imports `src/inkwise.css` for the home and shell, then `src/typography.css` for shared roles and home readability overrides, then `src/workspace.css` for operational sections and overlays inside `@scope (.workspace-view)`. These views and overlays carry the `.workspace-view` boundary. The former four operational stylesheets live in `.impeccable/archive/previous-workspace-styles/` and must not be imported. Alternate dashboards remain under `.impeccable/archive/` and must not be mounted.

The library defaults to Grid, with four white quick-action cards above a desktop layout containing a 235px document navigation column on the left. Its asset grid has three columns, grows to four at 1700px, becomes two at 1200px and one at 600px. The navigation column narrows to 215px at 1200px and moves below the assets at 850px. Quick actions become two columns at 850px. Calendar side content moves below the calendar at 1200px; AI visibility panels and four-part summary strips become two-column or stacked layouts at 850px.

Dense data scrolls within its own surface: the library list has a 780px minimum at 600px and below; keyword rows have a 560px minimum within `.cs-keyword-table` at that breakpoint. The calendar month keeps a 1120px grid inside `.cs-month-grid`, and week view retains seven columns with a 160px minimum each. Text wraps inside these cells. Dialogs use the viewport width minus 32px, cap their height, and scroll internally; the composer’s paired fields stack at 600px.

Current reference and rendered evidence paths are recorded in the sidecar. Build and rendered home plus an operational view are required after changing stylesheet boundaries. Evidence describes the implementation and does not claim pixel identity with the source image.

## Elevation & Depth

The home composition relies on solid tonal layering rather than raised cards: cool canvas, near-white panels, and white inner cards. Navigation has no active-state shadow. Floating menus, the mobile rail, dialogs, and toasts use diffuse shadows. The dialog backdrop dims the workspace. Exact overlay shadows, focus treatment, and the home shortcut’s local gradient are in the sidecar.

**The Overlay Depth Rule.** Reserve substantial shadow and backdrop blur for content that floats over the workspace.

## Shapes

Large rounded panels contain smaller rounded white groups, document thumbnails, and compact rectangular controls. The active navigation uses a rounded square, not a circle. Initial avatars, channel markers, notification dots, gauge endpoints, and the eight-node brand ring use circular geometry. Fine horizontal rules divide table rows; small rectangular status tags avoid large pill silhouettes. The setup gauge uses three rounded SVG arc segments and subtle fading fills.

Document previews are HTML/CSS miniature sheets with varied text, blocks, and columns. Icons, logo, and the setup gauge use SVG. Workspace avatars use initials and document icons. `Logo` in `src/main.jsx` and `public/favicon.svg` use eight rounded nodes rotated around a ring. Earlier arrow marks and contributor portraits are retired; portrait assets live in `.impeccable/archive/previous-workspace-assets/`. There are no active photo assets. Reference and review images are evidence only and are not shipped as interface images.

## Components

- **Actions:** New content uses the deeper periwinkle fill, white text, and a plus icon. Calendar and Library use white secondary buttons; AI visibility is a small warm-gradient shortcut. Small panel actions use white rounded squares. Hover changes surface color. All native buttons, links, inputs, and selects use a visible 3px periwinkle outline with 3px offset; disabled paging controls reduce opacity.
- **Header search:** A softly filled rectangular field shows a keyboard hint when empty and a clear button when populated. Command/Ctrl+K focuses it. Typing returns to home and filters the recent previews by title/keyword and the table by title/keyword/type. It is distinct from each operational section's own search.
- **Navigation:** Desktop icon buttons expose tooltips; expanded rail labels replace them. The active destination is periwinkle. Mobile More reveals all labeled destinations. Selecting a destination closes expanded navigation, clears header search, resets the shared content filter, closes popovers, and scrolls to the top.
- **Recent content:** Up to four matching records render as miniature paper previews with category tags, a wrapping 16px title, initial avatar, workspace name, and date. Each card opens the shared content detail dialog. The corner arrow opens the library. A paper sheet lifts 4px on hover; reduced-motion preference removes this movement.
- **All content:** The fixed-layout table shows name, workspace, scheduled date, channel icons, status, and a detail action. It displays six records per page. Date scope offers All content, the fixed sample week of September 14–20, 2026, or Published. The filter panel adds a status selector and reset action. Empty results explain how to change the search or filters. Previous/next controls are bounded and include range and page labels.
- **Activity and overview:** Three white activity cards link to content, social, and keyword views. The gauge records 100% setup, or 5/5 steps, and opens Settings. Its linked rows show 108 published assets, 132 tracked keywords, and 28 social post sets. The segmented arc is a setup illustration, not a measured breakdown of those unrelated counts.
- **Library and social:** Grid is the default view, reusing the home’s `DocumentPreview` in upright white asset cards. Four quick-action cards and left document navigation establish the desktop hierarchy. List/grid views provide title-and-keyword search, type tabs, status filtering, date/title sorting, and topic collections. Social restricts the base records to social posts. Select-all targets visible rows. Bulk review updates selected unpublished records; published records retain their status. Default Export downloads visible filtered rows; selection Export includes selected records retained outside the current filter. Analytics summarize local preview records.
- **Calendar:** A single white divided summary strip presents metrics without mini-charts. Month, Week, and Agenda share the records and type filter. Date navigation and Today change the period. Selecting a day updates its agenda; events open the content dialog. Add content prefills the selected date. Published month events retain full text opacity and an accessible check icon.
- **Composer and dialog:** The shared native composer accepts title, type, status, date, time, and keyword. Calendar and keyword actions prefill their corresponding fields. Saving creates a session record. Detail close controls, Escape, and backdrop click dismiss the content dialog. Mark ready for review changes local state and produces a dismissible toast that clears after 3.5 seconds. Workspace popovers dismiss on outside pointerdown or Escape.
- **Research:** Five historical source keywords support name search and a lower-difficulty filter, with keyword-to-composer actions. AI visibility retains the recorded baseline and source date, identifies unscored readiness, and requires a connected workspace for fresh scans. Research metrics use the same compact divided summary strip. AI visibility uses a white document report sheet instead of the retired ring illustration; operational gradient callouts and mini-charts are removed.
- **Motion and data:** Buttons inherit short background, shadow, and color transitions; document paper motion uses a 200ms easing. Reduced-motion preference disables transitions and animations. Sample schedules are illustrative, source counts are historical snapshots, and edits reset on reload. No backend, live generation, or publishing is configured.

## Do's and Don'ts

### Do:

- **Do** preserve the user-selected Inkwise home composition and shell hierarchy.
- **Do** use Uplift AI content and terminology within the selected visual reference.
- **Do** preserve the reviewed action and status contrast and visible keyboard focus.
- **Do** keep content at 16px, metadata and controls at 14px, section headings at 20px, and page titles at 32px desktop / 28px mobile.
- **Do** keep wide tables and calendar grids inside their own scroll containers.
- **Do** preserve the eight-node periwinkle ring and the single active Inkwise home.
- **Do** keep operational CSS scoped to `.workspace-view` in `src/workspace.css`.
- **Do** distinguish historical source counts, sample schedules, and session-only changes.

### Don't:

- **Don't** bring original Uplift AI website images or layouts into this dashboard.
- **Don't** restore earlier arrow logos, contributor portraits, metric mini-charts, tilted document placeholders, or operational gradient callouts from other dashboards.
- **Don't** import archived dashboards, stylesheets, or portrait assets into the app.
- **Don't** use the decorative paper-preview microtype as a real content text scale.
- **Don't** imply that local creation or review actions generate, publish, or persist content.

## Appearance themes

The header's sun/moon switch changes between light and dark without leaving the current view. Settings → Appearance also offers System. The choice is stored under `dashboard-2-theme` in browser local storage, synchronizes between tabs, and is applied before React loads to avoid a light flash. System follows the device while no explicit preference is saved.

Dark mode preserves the Inkwise composition, ring mark, type roles, and scoped workspace boundary. `src/inkwise.css` owns the shared theme roles: charcoal canvas `#151820`, panel `#1e232e`, raised surface `#272d3a`, primary text `#e8ebf3`, supporting text `#b0b8cb`, and periwinkle action `#a7b3ff` with dark text `#171e38`. Success and review states use muted green and amber surfaces with lighter matching text. Document artwork, data colors, controls, native fields, scrollbars, selection, popovers, dialogs, and focus rings use the same roles. Operational rules stay inside `@scope (.workspace-view)` in `src/workspace.css`. Type sizes and layout do not change with the theme.
