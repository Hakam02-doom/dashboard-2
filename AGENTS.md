# Dashboard project

- The active design authority is the Inkwise dashboard at https://dribbble.com/shots/27222028-UI-UX-Design-Document-Editor-Dashboard-Inkwise, with Uplift AI/LunchLink content. Follow a later explicit user change if provided.
- Mount only one home dashboard: `src/InkwiseDashboard.jsx`. Alternate designs live in `.impeccable/archive/` and must not be imported into the app.
- `src/inkwise.css` owns the home and shell. `src/workspace.css` owns all operational sections and overlays inside `@scope (.workspace-view)`. `src/typography.css` defines shared type roles and home readability. Older CSS lives in `.impeccable/archive/previous-workspace-styles/` and must never be imported.
- The eight-node periwinkle ring is the active mark. Never restore the earlier arrow logo, contributor portraits, metric mini-charts, tilted document placeholders, or gradient callouts from other dashboards.
- Keep content at 16px, metadata/controls at 14px, section headings at 20px, and page titles at 28–32px; miniature aria-hidden document artwork is the only small-type exception. Dense tables scroll locally on mobile.
- Keep new work in this project's directory. Do not copy or wire another project's home screen into this app.
- Validate with `npm run build` and check the rendered home plus a retained operational view after changing CSS boundaries.
