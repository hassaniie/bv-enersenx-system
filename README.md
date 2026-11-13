# EnerSenX — Energy Monitoring Dashboard

The main Dashboard screen from the Figma file, built with Next.js, shadcn/ui (`base-nova`) and the free ReUI components.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Preview the data states

Every panel has its own loading, empty and error state. Add `?state=` to the URL:

- `/?state=loading`: skeletons
- `/?state=empty`: empty states with an action
- `/?state=error`: inline errors with Retry

## Where things are

- `src/lib/dashboard-data.ts`: sample data from the Figma. Replace `fetchDashboard` with your API call.
- `src/components/dashboard/`: the screen (sidebar, top bar, KPI row and three rows of panels).
- `src/components/reui/`: ReUI components (frame, badge, icon-tile, alert, data-grid).
- `src/components/ui/`: shadcn/ui components.
- `src/app/globals.css`: theme tokens, mapped from the Figma colors.

## ReUI with Claude Code

The ReUI skill is in `.claude/skills/reui` and the MCP server is in `.mcp.json`. In Claude Code, run `/mcp`, choose `reui` and sign in (a free account works).

## Deploy (GitHub Pages)

Every push to `main` builds a static export and publishes it with `.github/workflows/deploy.yml`.

One-time setup: on GitHub, open the repo's **Settings → Pages** and set **Source** to **GitHub Actions**.

The site is served at `https://<your-username>.github.io/<repo-name>/`. The workflow sets `NEXT_PUBLIC_BASE_PATH` to the repo name, so asset paths resolve under that sub-path.
