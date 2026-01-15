# TimeZoneHelper

A small React + Vite tool to compare multiple time zones and see when their daily availability windows overlap.

It auto-detects your local time zone on load. Every time you select a time zone in the last empty row, another selector row is added automatically.

## Features

- Auto-detect local time zone
- Add unlimited additional time zones (auto-expanding list)
- Hour grid showing converted times per zone
- Highlights hours where **all** selected time zones are inside the chosen availability window
- i18n: English/German toggle (auto-detect + persisted in `localStorage`)
- Accessibility: labeled controls, table caption/scope, polite screen-reader announcements

## Tech

- React + TypeScript
- Vite
- Tailwind CSS
- Radix Popover + cmdk (for searchable time zone picker)
- lucide-react icons

## Local development

```bash
npm install
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`).

## Build & test production build locally

```bash
npm run build
npm run preview
```

Because this project is configured for GitHub Pages under `/TimeZoneHelper/`, open the preview URL **including** the path, e.g.:

- `http://localhost:4173/TimeZoneHelper/`

## Deploy to GitHub Pages (simonwaldherr)

This repo is pre-configured to deploy to:

- https://simonwaldherr.github.io/TimeZoneHelper/

### 1) GitHub Pages settings

Repo → **Settings → Pages**  
Set **Build and deployment → Source** to **GitHub Actions**.

### 2) Push to `main`

The included workflow `.github/workflows/deploy.yml` will build the site and deploy the `dist/` folder to GitHub Pages.

## Notes

- `vite.config.ts` includes `base: "/TimeZoneHelper/"` for correct asset paths on GitHub Pages.
- If you rename the repository, update the `base` path accordingly.

## License

MIT
