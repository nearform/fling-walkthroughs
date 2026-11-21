# Fling walkthroughs

Self-playing walkthroughs of Fling with Claude, published at https://fling-tour.fling.labs.nearform.com (the site `fling-tour` on the fling.labs.nearform.com Fling). The tours were recorded on infinitesoftwarefactory.com, which is still where `capture/` points. README.md has the layout and commands. This file covers how to change things.

## The rules

1. **Everything shown is real.** Screenshots come from the real Fling via `tours/<id>/capture.mjs`. Terminal and Claude lines in `scenes.js` are copied from real runs (`transcripts/`), trimmed but never invented. If the product changed, re-run and re-capture; don't edit the old output to match.
2. **No private data, ever.** The real accounts appear only as Sam Rivera (`you`, sam@example.com) and Ana Lopez (`reviewer`, ana@example.com), defined in `capture/config.mjs`. No real names, gmail or nearform addresses, API keys (`fling_…`, `sk-ant-…`), JWTs, OAuth `state`, host names or home-folder paths. Keys are shown as `fling_••••…`.
   - Take screenshots only through `shoot()` / `open().snap()` in `capture/shoot.mjs`, which redact and refuse unsafe shots. Never save a screenshot with `page.screenshot` directly.
   - Pipe recorded output through `node capture/redact-text.mjs`.
   - Run `node scan.mjs` on `dist/` before any publish. The scan must pass.
   - Never commit `capture/profiles/` or `tmp/` (both gitignored; they hold sign-ins).
3. **Ask before publishing.** Flinging `dist/` changes the live site. Confirm with the user first.

## Publishing the site

The site is `fling-tour` on the fling.labs.nearform.com Fling (public). The home page is the root of the site, and each tour is its own Path (`/<id>/`), so tours can be republished one at a time. When asked to publish (or "fling it"):

1. `rm -rf dist && node build.mjs` builds every tour into `dist/<id>/`. `node build.mjs <id>` builds one.
2. For the home page, copy `home/index.html` and `player/player.css` into a folder of their own (e.g. `dist-home/`, kept outside `dist/`). `build.mjs` doesn't do this.
3. `node scan.mjs` (and `node scan.mjs dist-home`). Stop if either reports anything.
4. Fling with the Fling tools on server `fling.labs.nearform.com`, site `fling-tour`. It is an existing site, so leave access alone.
   - Each changed tour: `fling_deploy` with path `dist/<id>` and `sitePath: "<id>"`. CLI: `fling deploy ./dist/<id> --name fling-tour --path <id>`.
   - The home page, if it changed: `fling_deploy` with path `dist-home`. This replaces the root files and leaves the tour Paths alone.
5. Give the user the review link and the site URL that come back.

## How a tour works

`player/page.html` loads `scenes.js` (sets `window.TOUR`), then `player/tours.js` and `player/player.js`. The player adds an intro card and an end card around `TOUR.steps`. The comment at the top of `player/player.js` is the step schema:

```js
{ chapter, caption, note?, layout?: 'split'|'term'|'shot', hold?: ms,
  term?: { kind: 'claude'|'shell'|'chat', title?, clear?, lines: [
           { user } | { cmd } | { out, tone? } | { say } | { tool, args? } | { res } | { ask, options, pick } ] },
  shot?: { src, url, as?: 'you'|'reviewer', cursor?: [x, y], click?, ring?: [x, y, w, h], zoom?: [x, y, scale] } }
```

- The terminal keeps earlier steps' lines unless `clear` is set. A step without `shot` keeps the previous screenshot.
- `ring`, `cursor` and `zoom` are percentages of the 1440×900 screenshot, not pixels. Get them from the live page with `measure(page, { name: locator })` in `capture/measure.mjs`, called right before the snap, rather than guessing. Check them by previewing the built tour.
- Terminal-only steps usually set `layout: 'term'` and a longer `hold`.

## Common changes

**Preview:** build, then serve `dist/` with any static server (`npx serve dist`).

**Edit a step's words:** change `tours/<id>/scenes.js`, then `node build.mjs <id>` and preview `dist/<id>/`.

**Retake shots:** both capture Chromes must be running (`node capture/login.mjs you` / `reviewer`, signed in). Run `node tours/<id>/capture.mjs <phase> [id,id]`. Phases follow the story (e.g. `before`/`after` a fix), because some shots depend on state that earlier steps create (comments posted, a site redeployed). Check the result with `capture/contact.sh <id>`. Look at the images yourself before using them.

**Add a step that needs a new shot:** add it to the tour's `capture.mjs` under an id, capture it, measure the ring/cursor, then add the step to `scenes.js`.

**Add a tour:** create `tours/<id>/` with `scenes.js`, `tour.json`, `capture.mjs` and `shots/` (copy an existing tour's shape). Then:
- add it to `player/tours.js` (the end card's "More walkthroughs")
- add a card to the hand-written nav in `home/index.html`, and update "five" in its title and meta tags
- renumber every tour's `eyebrow` ("Fling walkthrough · N of M")
- put any site it publishes under `demos/<name>/`

## Demos

`demos/` holds the sites the tours publish, so they can be re-published to recreate the state a capture needs. `triage-desk` is a site server (`server.ts`, `fling.json`). It needs an `ANTHROPIC_API_KEY` Fling secret, which never goes in the repo. `support-evals` builds its pages with `build_pages.py` and merges labels back with `merge_labels.py`.

## Style

- Captions are short and plain. Notes explain why in a sentence or two. Write UK/US-neutral prose and use curly quotes and apostrophes (’ “ ”), as the existing tours do.
- No framework or bundler. Plain ES modules and vanilla JS. Keep it that way.
- Node 22+, `"type": "module"`.
