---
name: Uplift AI Dashboard
description: A compact content operations dashboard following the selected Clinexa screen.
colors:
  ink: "#282c36"
  supporting: "#68717e"
  purple: "#6363ac"
  panel: "rgba(255, 255, 255, 0.79)"
  white: "#ffffff"
  line: "#e9edf2"
  green: "#b4dba5"
  chart-lavender: "#b8b7f4"
  chart-social: "#b4dca4"
  chart-blue: "#95cdf7"
  chart-gold: "#f7d494"
  chart-neutral: "#e7ebef"
typography:
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "23px"
    fontWeight: 500
    letterSpacing: "-0.7px"
  metric:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "33px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-1.4px"
  title:
    fontSize: "15px"
    fontWeight: 500
    letterSpacing: "-0.45px"
  body:
    fontSize: "12px"
    fontWeight: 400
  card-title:
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "-0.25px"
  card-meta:
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  field: "10px"
  card: "16px"
  mobile-panel: "17px"
  panel: "20px"
  circle: "50%"
spacing:
  small: "8px"
  compact: "10px"
  medium: "16px"
  gutter: "18px"
  panel: "20px"
  roomy: "24px"
components:
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
  content-card:
    backgroundColor: "transparent"
    rounded: "{rounded.card}"
    padding: "13px 11px 13px"
  button-primary:
    backgroundColor: "#6c6caf"
    textColor: "{colors.white}"
    rounded: "18px"
    padding: "11px 16px"
  button-primary-hover:
    backgroundColor: "#575795"
  button-secondary:
    backgroundColor: "transparent"
    rounded: "{rounded.panel}"
    padding: "8px 12px"
  button-circle:
    backgroundColor: "transparent"
    rounded: "{rounded.circle}"
    size: "29px"
  input-search:
    backgroundColor: "#f1f3f7"
    rounded: "{rounded.field}"
    padding: "10px 15px"
  navigation-active:
    backgroundColor: "#6666ad"
    textColor: "{colors.white}"
    rounded: "{rounded.circle}"
    size: "39px"
  status-scheduled:
    backgroundColor: "#eaf2e5"
    textColor: "#628356"
    rounded: "15px"
    padding: "6px 10px"
---

# Design System: Uplift AI Dashboard

## Overview

**Creative North Star: "The selected Clinexa dashboard screen"**

This system records the implemented Uplift AI dashboard in React and Vite. Its visual authority is the user's selected screen inside the Clinexa laptop reference, adapted to Uplift's content operations terminology. The cool lavender-to-mint canvas, soft white panels, compact Inter typography, purple icon rail, and pastel charts follow that selection; this is not a newly invented visual identity.

**Key Characteristics:**

- Quiet tonal separation between the canvas and panels.
- Compact text with large, steady metric numerals.
- Rounded controls, slim SVG icons, and pastel data graphics.
- A dense desktop overview that stacks into a mobile workspace.

## Colors

Purple identifies navigation and primary actions. Green emphasizes published activity. Lavender, green, blue, gold, and pale gray consistently identify the five distribution categories; their softer fills keep the numeric and textual labels prominent.

Neutral ink carries headings and values; supporting text uses a quieter slate. Translucent white panels expose the cool canvas gently. The canvas is the CSS `--canvas` gradient, recorded in the sidecar because it is an image value rather than a color token.

**The Labeled Data Rule.** Pair chart colors and status dots with text; preserve the visible illustrative-data and snapshot labels.

## Typography

Inter is the single typeface, with the platform sans-serif stack as fallback. Medium weight establishes hierarchy without heavy display styling. The normative role values above describe the default desktop sizes, not an imposed modular scale.

Page headings lead; metric values use tabular numerals and tight tracking; section titles, content titles, and metadata step down clearly. Card titles retain two-line clamping and their final readable size across breakpoints. Content metadata wraps rather than becoming a smaller desktop transcription. Detail copy uses comfortable line heights, with the informational block capped at 70 characters.

Metric numerals adapt from the default size to 38px on wide screens, 29px in compact desktop, 32px on tablet, and 27px on mobile. Section headings similarly adapt to available space. Tiny chart and footer annotations remain secondary; their smallest existing sizes are not a reusable body-text standard.

## Layout

The desktop shell combines a sticky 56px navigation rail with a flexible main region capped at 1700px. Four equal metric cards precede a two-column grid: the production chart and upcoming items occupy the wider column; the distribution panel spans both rows in the narrower column. The default column ratio is 2.12:1, with an 18px gutter, a 350px first row, and an auto-expanding second row of at least 214px. Three upcoming cards share a row.

- At 1450px and above, spacing and chart height increase; dashboard rows become 385px and 238px.
- At 1150px and below, gutters tighten, the column ratio becomes 1.85:1, and content introductions stack vertically. Between 851px and 1150px, card status text is hidden.
- At 850px and below, metrics become two columns. The main panels stack as production, distribution, upcoming; distribution retains an internal two-column chart-and-legend layout. Detail rows hide their date column.
- At 560px and below, the rail becomes a fixed 66px bottom navigation, the shell reserves 78px below content, and the More control opens all destinations in a two-column menu. Upcoming cards become one column; metadata wraps; toolbars stack; distribution insight spans both internal columns. The minimum supported body width is 360px.

### Section extension: library, calendar, and research

The added sections reuse the original shell, panels, Inter typography, pastel graphics, and rounded controls. Their own layout tightens at 1250px; at 1000px, library and calendar sidebars move below the main surface and summary metrics become two columns. At 700px, asset grids use two columns and the seven-day week view scrolls horizontally instead of crushing its events. The existing bottom navigation applies at 560px. The research panels also stack at 1000px.

## Elevation & Depth

Panels rely primarily on tonal separation. Metric hover introduces a very faint shadow; floating menus, tooltips, dialogs, and toasts use progressively clearer diffuse shadows. The modal backdrop dims and blurs the page. The bottom navigation uses a translucent, blurred surface. Exact shadows and backdrop treatments live in the sidecar.

**The Overlay Depth Rule.** Reserve substantial shadow and backdrop blur for content that floats over the workspace.

## Shapes

Large soft panel corners, smaller nested card corners, rounded bar-chart tracks, and circular navigation buttons form the recurring geometry. Thin neutral borders define fields and nested cards; dashed dividers separate card metadata and chart gridlines. SVG supplies the logo, icons, donut, sparkline, and gauge; CSS supplies the bar marks. Upcoming-content cards and their detail views use locally stored demo portrait avatars. Reference and review images are documentation evidence only.

## Components

- **Buttons:** Purple primary actions, outlined secondary actions, and circular paging controls. Hover changes surface color; focus-visible uses a 3px lavender outline with 4px offset. Disabled paging controls reduce opacity. Buttons transition background, shadow, and color over 180ms.
- **Navigation:** Circular icon buttons expose tooltips on desktop hover and focus. The active destination is filled purple. On mobile, More reveals labeled destinations; selecting a destination closes the expanded menu and clears list filters.
- **Metrics and charts:** Metric cards navigate to their relevant detail view. Week, Month, and Year replace the illustrative production series. Bar hover and keyboard focus reveal published/planned values. Distribution legend buttons toggle category emphasis and center text, expose pressed state, and dim the other segments.
- **Content cards and lists:** Three-item paging advances one item at a time. Cards and list rows open the same native content-detail dialog. Library search matches title and keyword; type tabs and the status selector filter the list. The empty state offers Reset filters. Library Export downloads the visible filtered rows; the selection toolbar exports selected records, including selections retained outside the current filter.
- **Fields and status:** Search uses a softly filled rounded field; the status selector uses a light border. Scheduled status uses green; draft and overdue states use warm amber. Labels accompany color.
- **Dialog and feedback:** The dialog closes through its close controls, Escape, or backdrop click. Mark ready for review updates session state and produces a dismissible status toast that clears after 3.5 seconds. Workspace popovers dismiss on outside pointerdown or Escape. Settings and connections display source snapshots, with no live mutation implied.
- **Motion:** Short color/opacity transitions and a small toast entrance are the complete motion vocabulary. Reduced-motion preference disables transitions and animations.

### Section extension: content operations

- **Library and social:** The shared section offers list/grid views, title-and-keyword search, article/social type tabs, status filtering, and date/title sorting. Social restricts its base records to social posts. Collections apply topic searches. Checkboxes select records; select-all targets the visible rows. Bulk review updates selected unpublished records to Ready for review; published records retain their status. Analytics summarize the local preview records rather than claiming live performance.
- **Calendar:** Month, Week, and Agenda share the same records and article/social filter. Date navigation and Today update the displayed period. Selecting a day updates its agenda; selecting an event opens the existing content dialog. Add content carries the selected date into the shared composer. Month cells use a check SVG with an accessible Published label for completed items, keeping event text at full opacity rather than using faded text to convey completion.
- **Shared composer:** Library, social, calendar, and keyword actions open a native dialog with title, type, status, date, time, and keyword fields. Calendar actions prefill the date; keyword actions prefill title and keyword. Saving creates a session record. This does not generate an article, publish content, or persist to a backend.
- **Research:** Keyword opportunities retain the five historical source keywords, searchable names, and a lower-difficulty filter; creation actions hand the keyword to the composer. AI visibility presents the recorded baseline and source date, identifies unscored readiness, and makes clear that fresh scans require a connected workspace. Decorative mini-charts are not a performance history.
- **Legibility:** Supporting text in the added sections uses darker slate and category-specific ink on pastel surfaces. The section muted variable is `--cs-muted` (`#626d7c`). Final library titles stay at 12px with 1.6 line height and metadata at 10px with 1.5 line height, including mobile; status text remains 10px and wraps. Calendar event titles retain the final 10px size. These final rules override earlier compact declarations.
- **Data disclosure:** Added sample records and schedules are explicitly illustrative. Footers retain demo/illustrative and session-only labels; research distinguishes source snapshots from decorative graphics. Local edits reset on reload, and no backend or live publishing is configured.

## Do's and Don'ts

### Do:

- **Do** preserve the user-selected Clinexa screen's quiet palette and dashboard hierarchy.
- **Do** retain readable card titles and metadata when adapting density.
- **Do** pair interactive chart marks with keyboard focus behavior and textual values.
- **Do** distinguish historical workspace snapshots, illustrative charts, and session-only changes.

### Don't:

- **Don't** import the original Uplift website's layout or imagery into this reference-led dashboard.
- **Don't** replace SVG and CSS data graphics with raster approximations.
- **Don't** treat the smallest auxiliary annotations as the default text scale for new components.
- **Don't** imply that a preview interaction publishes content or changes a live connection.
