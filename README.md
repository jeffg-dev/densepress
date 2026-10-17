# DensePress

Browser extension for Firefox and Chrome that turns a web article into a dense, print-ready page. Click the toolbar button and the article opens in a new tab with:

- EB Garamond 10pt, 1.2 line height, justified with hyphenation
- Journal-style paragraphs (no gap, first-line indent)
- Compact headings
- US Letter, 0.5in margins
- Two-column layout (toggle)
- Images fit to one column (toggle)

Toggle settings are remembered. Article extraction uses Mozilla's [Readability](https://github.com/mozilla/readability), the same engine as Firefox Reader View.

Repo: https://github.com/jeffg-dev/densepress

## Prebuilt

The `builds/` folder holds ready-to-install packages:
- `densepress-firefox-1.0.1-signed.xpi` is signed by Mozilla. Open it in Firefox to install.
- `densepress-chrome-1.1.0.zip` is a Chrome developer build. Unzip it and use Load unpacked (see below).

The signed Firefox build is 1.0.1. 1.1.0 adds Chrome support and the repo link, with no change to Firefox behavior.

## Build

Requires Node 18+ and the `zip` command.

```sh
npm run build              # both browsers
node scripts/build.mjs chrome
node scripts/build.mjs firefox
```

Output:
- `dist/chrome/` and `dist/densepress-chrome-<version>.zip`
- `dist/firefox/` and `dist/densepress-firefox-<version>.zip`

The version comes from `package.json`. Per-browser manifests are built by merging `manifests/base.json` with `manifests/chrome.json` or `manifests/firefox.json`.

## Install

### Chrome (also Edge, Brave, Arc)
1. Build, or unzip the Chrome zip
2. Go to `chrome://extensions` and turn on Developer mode
3. Click **Load unpacked** and select `dist/chrome`

This survives restarts. Pin the extension from the puzzle-piece menu so the button is visible.

### Firefox
Release Firefox only installs signed add-ons.

- **Signed (permanent):** upload `dist/densepress-firefox-<version>.zip` at addons.mozilla.org → Developer Hub → Submit a New Add-on → "On your own". Install the signed `.xpi` it returns. Each upload needs a new version number in `package.json`.
- **Temporary (testing):** `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → select `dist/firefox/manifest.json`. It's removed when Firefox restarts.

Lint the Firefox build with `npm run lint:firefox`.

## Printing

In the print dialog:
- Margins: Default (the extension sets them with `@page`)
- Scale: 100%
- Turn off headers and footers

The on-screen preview balances columns across the whole article, so its column breaks won't match the printed pages. Use the browser's print preview for the real layout.

## Layout

```
src/
  background.js   toolbar click → inject Readability → open reader tab
  extract.js      runs Readability in the article's page
  reader.html     print view
  reader.css      all typography and page geometry
  reader.js       toggles, settings, content sanitizing
  lib/            Readability.js (vendored, patched; see below)
  fonts/          EB Garamond woff2 (SIL Open Font License)
  icons/
manifests/        base + per-browser manifest overrides
scripts/build.mjs
```

## Third-party code

- `src/lib/Readability.js` is Mozilla Readability (Apache 2.0, license in `src/lib/Readability-LICENSE.md`). It's patched to remove two `innerHTML` assignments that AMO's validator flags. Both changes are marked with `DensePress:` comments.
- `src/fonts/` contains EB Garamond (SIL OFL 1.1, license in `src/fonts/OFL.txt`).
