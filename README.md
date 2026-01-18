# Teen Deen

A privacy-first, static web app for teenagers to learn core Islamic concepts through short lessons and self-check quizzes.

**Target audience:** Teens (ages 13–18)

## Structure

- `index.html` — Home with featured lessons and progress tracking
- `parents.html` — Parent/guardian guide
- `lessons/index.html` — Lessons list with search
- `lessons/lesson.html` — Single lesson view with quiz and sharing
- `assets/styles.css` — Responsive design system
- `assets/app.js` — Data loading, filtering, quiz logic, and sharing
- `assets/main.js` — Filtering and interaction logic
- `assets/base-path.js` — **GitHub Pages path resolver** (handles `/islamic-kids-app/` subpath)
- `assets/lessons.json` — Lessons metadata
- `.github/workflows/deploy.yml` — GitHub Pages deployment via Actions
- `.nojekyll` — Disable Jekyll to serve assets

## GitHub Pages Base Path Handling

This app is deployed under a **subpath**: `https://naser-labs.github.io/islamic-kids-app/`

To make this work, we use a centralized base path resolver:

### How it works

1. **`assets/base-path.js`** loads first on every page
2. It detects the base path from:
   - `<meta name="site-base" content="/islamic-kids-app">` (explicit)
   - Auto-detection from URL pathname
   - Falls back to root `/`
3. Exports `window.withBase(path)` function used throughout the app
4. All fetch calls use: `fetch(withBase('assets/lessons.json'))`
5. All internal links use: `href="${withBase('lessons/')}"` in JavaScript

### Debug Mode

Add `?debug=1` to any URL to see diagnostic overlay:

```
https://naser-labs.github.io/islamic-kids-app/?debug=1
```

The overlay shows:
- Computed base path
- Manifest URL being fetched
- Number of lessons loaded
- Last error (if any)

This makes it easy to diagnose path issues on GitHub Pages.

### Testing Locally

When testing locally, the base path auto-detects as empty/root, so everything works:

```bash
python -m http.server 8080
# Open http://localhost:8080/
```

Or use npx:

```bash
npx serve
```

### Link Checking

Check for broken internal links:

```bash
# Install globally or use npx
npm i -g broken-link-checker

# Check local build
npx broken-link-checker http://127.0.0.1:8080/islamic-kids-app/ --recursive

# Or check production
npx broken-link-checker https://naser-labs.github.io/islamic-kids-app/ --recursive
```

## Responsive & Accessibility

- Mobile-first adjustments: aspect-ratio hero, stacked controls, no horizontal scroll
- Buttons: min-height 44px (tap targets)
- Typography: `clamp()` sizes for headings and body
- Safe-area padding with `env(safe-area-inset-*)`

## Sharing (static, privacy-safe)

- Desktop: Copy Results + Email Results
- Mobile: Copy Results + Email Results + Text Results (SMS)
- SMS link format decisions:
  - iOS (iPhone/iPad/iPod): `sms:&body=<encoded>` or `sms:+123...&body=<encoded>`
  - Android/others: `sms:?body=<encoded)` or `sms:+123...?body=<encoded>`
- Optional parent phone (localStorage key: `parentPhone`) used if present

## Deploy (GitHub Pages)

Project Pages URL: `https://naser-labs.github.io/islamic-kids-app/`

This repo uses a GitHub Actions workflow to deploy the static site to Pages from the `main` branch.

### One-time setup

1. Ensure repository name is `islamic-kids-app`
2. Enable GitHub Pages in Settings → Pages → Source: GitHub Actions

### Push updates

```bash
# From the project root
git add .
git commit -m "Update lessons or fix bugs"
git push origin main
```

The workflow will publish the site automatically within 1-2 minutes.

## PWA & Offline

- Installable via the browser's "Add to Home Screen" prompt (manifest + icons provided)
- Offline-first caching of core pages and assets via `sw.js`
- Safe updates with versioned cache: update `CACHE_VERSION` in `sw.js` to bust old caches
- Friendly offline messages are shown when the network is unavailable

### Files

- `manifest.webmanifest` — app metadata, icons, theme colors
- `sw.js` — service worker: caches pages/assets, updates cache on new fetches, serves offline fallback
- `assets/icon.svg`, `assets/icon-maskable.svg` — icons for install

### Share options

- Copy Results — works everywhere
- Email Results — mailto link with prefilled subject/body
- Text Results — `sms:` deep link (iOS vs Android formats), optional parent/guardian phone from `localStorage`
- Web Share — shown when `navigator.share` is available, falls back to Copy

### Local-only progress

- `localStorage`: `lastLessonId`, `completedLessons` (array), `lessonScores` (map)
- Home shows a "Progress" card: "X lessons completed"

## Validation workflow

Pull requests to `main` run `scripts/validate.js` to:

- Check `assets/lessons.json` schema (id, number, title, minutes, tags)
- Check that internal links exist within the repo (ignores external links)

```bash
# Manually run validation locally
node scripts/validate.js
```

## Troubleshooting

### Lessons not loading on GitHub Pages

1. Add `?debug=1` to the URL to see diagnostic info
2. Check browser DevTools Network tab for 404 errors
3. Verify `assets/lessons.json` exists in repo
4. Ensure `base-path.js` is loaded before `app.js` and `main.js`
5. Check that `<meta name="site-base">` tag is present in all HTML files

### Service Worker issues

1. Clear browser cache and unregister old service workers
2. Update `CACHE_VERSION` in `sw.js` when deploying changes
3. Test in incognito/private mode to avoid cache conflicts

### Local development issues

1. Use a proper HTTP server (not `file://` protocol)
2. Python: `python -m http.server 8080`
3. Node: `npx serve`
4. Base path will auto-detect as empty for local development
