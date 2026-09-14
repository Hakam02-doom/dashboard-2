# Dashboard 2: project identity

- Only edit `/Users/hakam/Documents/ChatGPT/dashboard-2` for Dashboard 2. This is an independent repository; never copy another dashboard's app, styles, assets, dependencies, or Vercel configuration into it.
- Design: Clinexa-inspired dashboard. Preserve this dashboard's own visual authority and user-approved changes.
- GitHub: `Hakam02-doom/dashboard-2`. Vercel project: `dashboard-2`. Identity is recorded in `dashboard.config.json`.
- Development: `npm run dev` → `http://127.0.0.1:5174/`. Production preview: `npm run preview` → port 4174. Ports are fixed and do not fall back.
- Before work, run `npm run check:project`. Before publishing, run `npm run build` and `npm run test:isolation`. Use `npm run deploy` for an authorized production deployment. Never override the port, working directory, or Vercel target.
- New clones: run `npm install` to install the repository's own dependencies and pre-push guard. Do not share node_modules or use a parent dashboard's installation.
- The old `/Users/hakam/Documents/ChatGPT/dashboard` folder is a routing index, not an application. Do not implement anything there.

# Dashboard 2

- This directory is Dashboard 2: the Clinexa-inspired Uplift AI/LunchLink dashboard.
- GitHub: `Hakam02-doom/dashboard-2`. Vercel project: `dashboard-2`. Production: `https://dashboard-2-sandy.vercel.app`.
- Dashboard 3 (Inkwise, including dark mode) lives in `/Users/hakam/Documents/ChatGPT/dashboard-3`. Make its changes there, using its own GitHub repository and Vercel project.
- Do not import or deploy Dashboard 3's home, styles, or theme from this directory. Keep the Dashboard 2 composition and assets intact.
- Dashboard 4 is now a separate sibling folder `../dashboard-4`; do not import it.
- Before every push/deployment, verify `git remote -v` and `.vercel/project.json` against the requested dashboard number.
- Run `npm run build` before deployment.
