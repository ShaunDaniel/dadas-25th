# Dada — A Silver Jubilee

A premium, animated e-invite for Dada's 25th birthday. Vite + React + Tailwind v4 + Framer Motion.

## Run

```bash
npm install
npm run dev      # local dev
npm run build    # production build -> dist/
npm run preview  # preview the build
```

## Personalized guest links

Each invitee gets their own URL: `https://dadas25th.github.io/adi`, `/priya`, etc.
That page opens with a personal hero — their name, a custom message, their photo, and a silver-confetti burst — then flows into the shared invitation.

- **Data:** `src/data/guests.json` — one entry per guest:
  ```json
  "adi": { "name": "Adi", "message": "…", "img": "adi" }
  ```
  The key (`adi`) is the URL slug, lowercased.
- **Photos:** drop `public/guests/<img>.jpg` (e.g. `public/guests/adi.jpg`). Square crops look best. Missing photo → the guest's initial is shown instead.
- The bare `/` URL shows the general (non-personalized) invitation.

## Deploying to GitHub Pages

A workflow is included at `.github/workflows/deploy.yml` (push to `main` → builds and deploys).
Enable **Settings → Pages → Source: GitHub Actions**.

Clean URLs like `/adi` work via the SPA redirect in `public/404.html`.

- **User/org page** (`dadas25th.github.io`): leave `base: '/'` in `vite.config.js` and `pathSegmentsToKeep = 0` in `public/404.html`. (default)
- **Project page** (`dadas25th.github.io/dada/`): set `base: '/dada/'` and `pathSegmentsToKeep = 1`.
