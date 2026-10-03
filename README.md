# Zenless website

The marketing and download site for **Zenless**, a family of separate, native Windows apps written in Rust:
Zenless Download Manager, Zenless Torrent, the Zenless Browser Integration extensions (Chromium + Firefox)
and the Zenless Setup installer.

Live at **https://zenless-suite.vercel.app**.

It's plain HTML, CSS and vanilla JavaScript, with no framework, no bundler and no build step. Deploy the folder as-is.

## Pages

| File | URL | What |
| --- | --- | --- |
| `index.html` | `/` | Landing page: hero, live Download Manager mock, the four products, theme showcase, Rust, privacy, FAQ, repos |
| `download.html` | `/download` | Installer, individual downloads, system requirements, extension setup, SmartScreen help |
| `privacy.html` | `/privacy` | Privacy policy for the apps, the extensions and this site |
| `404.html` | any missing URL | Served automatically by Vercel |
| `firefox/updates.json` | `/firefox/updates.json` | Firefox update manifest (the add-on's `gecko.update_url`), served as JSON with a 5-minute cache |

## Layout

```
assets/
  css/themes.css     34 app palettes (GENERATED, see "Themes")
  css/site.css       everything else, written only in theme tokens
  js/theme-init.js   runs in <head>: applies the saved theme before first paint
  js/site.js         theme switcher, mobile nav, scroll reveals, animated app mocks, copy buttons
  img/icons.svg      icon sprite (<svg><use href="/assets/img/icons.svg?v=…#name"/></svg>)
  img/*.svg          app icons (copied from brand/), extensions.svg, og.svg / og.png
brand/               source logos (SVG, PNG, ICO), a small press kit
tools/gen-themes.mjs regenerates themes.css from the Rust theme file (not deployed)
favicon.svg / favicon.ico / apple-touch-icon.png
vercel.json          clean URLs, cache + security headers (incl. CSP)
firefox/updates.json Firefox update manifest (see below)
robots.txt, sitemap.xml
```

## Local preview

Any static server works. To get Vercel's clean URLs (`/download` → `download.html`) use the Vercel CLI:

```bash
npx vercel dev
# or, without clean URLs:
npx serve .
```

## Themes

The 34 palettes (Zenless, the AMOLED set, Dracula, Nord, Catppuccin, One Dark, Kanagawa, Synthwave,
Solarized, Paper, Lavender, Sakura and more) are the exact 15-color palettes from
`builtin_themes()` in the apps' shared `src/shared/theme.rs`. Each is a `[data-theme="<id>"]` block of
CSS custom properties (`--bg --surface --surface2 --input --stripe --border --text --dim --accent
--accent-fg --accent2 --success --warning --danger --info`). `site.css` derives everything else from them
with `color-mix()`.

- The active theme is `data-theme` on `<html>`, saved in `localStorage` under `zenless-theme`. Storage
  access is wrapped in try/catch, so the site falls back to the default when storage is blocked.
- Any element can carry its own `data-theme`. The theme swatches use this to preview each palette.
- When a theme's palette changes in the apps, regenerate:

  ```bash
  node tools/gen-themes.mjs            # expects ../zenless-download-manager next to this repo
  node tools/gen-themes.mjs path/to/theme.rs
  ```

  The script also rewrites the id/name list in `assets/js/theme-init.js`. After regenerating, bump the
  `?v=` cache-buster on the CSS/JS links in every page (those files are cached for a year).

## Domain

The absolute URL `https://zenless-suite.vercel.app` appears only where it has to be absolute:
`canonical`, `og:url`, `og:image` and `twitter:image` in the `<head>` of `index.html`, `download.html` and
`privacy.html`, plus `sitemap.xml`, `robots.txt` and the JSON-LD block in `index.html`. To move domains,
search and replace that string. Everything else uses root-relative paths.

## Caching

`vercel.json` serves `/assets/css/*` and `/assets/js/*` as `immutable` for a year. They're referenced
with a version query (`?v=0.1.0`), so **bump `?v=` in every HTML file whenever you change a CSS or JS file**
(or the icon sprite). Images are cached for a week, and HTML uses Vercel's default (always revalidated). `/firefox/updates.json` is
sent as `application/json` with a 5-minute cache, so a new entry reaches Firefox quickly.

## Security headers

A strict Content-Security-Policy is set in `vercel.json`: scripts from self only (no inline scripts;
the JSON-LD block is data, not script), styles from self plus Google Fonts, and no inline `style=""`
attributes. Dynamic values are set through the CSSOM (`el.style.setProperty`), which CSP allows. Keep new
markup free of inline scripts and style attributes, or the browser will block them.

Also set: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`,
`Cross-Origin-Opener-Policy` and HSTS.

## Open Graph image

`assets/img/og.png` (1200×630) is rendered from `assets/img/og.svg` in headless Chrome, with the site's
Google Fonts loaded (inline the SVG into a page, wait for `document.fonts.ready`, screenshot at
1200×630). If you edit the SVG, re-render the PNG.

## Accessibility & motion

Semantic landmarks, a skip link, visible `:focus-visible` rings and labelled controls. Body and secondary
text meet WCAG AA in the default theme and the light themes (secondary text uses a slightly darker
`--faint` there). Buttons keep each app palette's exact accent / on-accent pair, so a few non-default
themes (e.g. Midnight's white on blue) are below 4.5:1 on button labels. The app mocks are
`role="img"` with a description. All animation stops under `prefers-reduced-motion: reduce`, and the
live mocks only animate while they're on screen and the tab is visible.

## Deploy

Import the repo in Vercel as a static project (Framework preset: **Other**, no build command, output
directory `.`). `vercel.json` handles the rest.

## Firefox update manifest

The Firefox add-on's `browser_specific_settings.gecko.update_url` is `https://zenless-suite.vercel.app/firefox/updates.json`. Firefox reads it about once a day and installs a newer **signed** version by itself, after checking `update_hash`. After each signed release, add the entry that the Firefox extension's release workflow prints (or run `node scripts/updates-manifest.js zenless-firefox-extension.xpi vX.Y.Z` in that repo) to `updates[]` and deploy. Keep older entries: Firefox picks the newest compatible one. Each `update_hash` must be the SHA-256 of the exact file at `update_link`, so compare it with the release asset's digest:

```bash
gh api repos/zenless-inc/zenless-firefox-extension/releases/latest --jq '.assets[] | select(.name|endswith(".xpi")) | .digest'
```

## License

MIT, see [LICENSE](LICENSE).
