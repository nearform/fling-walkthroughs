# Fling walkthroughs

Five short, self-playing walkthroughs of [Fling](https://infinitesoftwarefactory.com) used with Claude. Each one starts with a problem, then plays through how Fling solves it, with a terminal (or Claude chat) beside a browser:

| Tour | The problem | How |
| --- | --- | --- |
| `get-started` | Claude made it. Now get it in front of people. | Ask Claude Code to fling it, choose who sees it, get comments Claude acts on |
| `claude-app` | No terminal? Do it from the chat. | Fling as a connector in Claude Desktop, on the web or your phone |
| `team-site` | Every ticket’s plan, in one place. | One team site, a page per ticket, each reviewed and signed off on its own |
| `eval-labelling` | Model outputs need human judges. | A page per sample, a blind form, and the labels back as data |
| `site-server` | It works on localhost. Now share it. | A small server beside the page: an API key, Claude, logs |

Live at https://fling-tour.fling.labs.nearform.com.

Nothing in a tour is mocked. The screenshots come from a real Fling and the terminal lines are the real output of running the commands (`transcripts/`). The two accounts used appear as the personas Sam Rivera and Ana Lopez. Redaction swaps the names when each shot is taken, and the build is scanned before it is published.

## Layout

```
tours/<id>/
  scenes.js     the steps: captions, terminal lines, which shot to show, where to point
  tour.json     title, description and poster image for the page's meta tags
  capture.mjs   takes this tour's screenshots on the real Fling
  shots/        the screenshots (1440×900 at 2×)
player/         the player (page.html, player.js, player.css) and tours.js, the list of tours
home/           the landing page
capture/        shared capture tooling: Chrome profiles, redaction, measuring
demos/          the sites the tours publish (reports, a team site, an eval set, a site server)
transcripts/    redacted terminal output the tours' lines are taken from
build.mjs       builds dist/
scan.mjs        refuses to publish dist/ if anything private is in it
```

## Build and preview

```sh
npm install
node build.mjs             # every tour → dist/<id>/
node build.mjs team-site   # just one tour
node scan.mjs              # check dist/ for private data
npx serve dist             # or any static server
```

## Publish

The site is a Fling itself (`fling-tour`). Ask Claude to fling it: CLAUDE.md has the steps, which add the home page, scan, and deploy.

## Retaking screenshots

Retaking needs a Mac with Google Chrome, two accounts on the Fling (one for "you", one for the reviewer), and the demo sites published under those accounts.

```sh
npx playwright install chromium      # Playwright drives your own Chrome over CDP
node capture/login.mjs you           # opens a Chrome; sign in as the first account, leave it open
node capture/login.mjs reviewer      # the same for the second account
node tours/get-started/capture.mjs before        # each capture.mjs lists its phases and shot ids
node tours/get-started/capture.mjs before review # just one shot
node capture/contact.sh get-started              # contact sheet in tmp/ to check by eye
```

`login.mjs` stores who each account is in `capture/profiles/` (gitignored). Each shot is redacted in the page before it is saved. If anything private is still visible, the shot is refused rather than saved.

To record terminal output for a transcript, pipe it through the same redaction:

```sh
fling deploy ./demos/q3-support-report 2>&1 | node capture/redact-text.mjs > transcripts/new.txt
```

## Contributing

See [CLAUDE.md](CLAUDE.md) for how the tours are put together and the rules for changing them. Claude Code reads it automatically, so "add a step to team-site showing X" or "retake the eval-labelling shots" works as a request.
