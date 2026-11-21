// Starts an ordinary Chrome (not automation-launched, so Google lets you sign in) with a capture
// profile of its own and a debugging port, then waits for you to sign in to the Fling.
//   node capture/login.mjs you|reviewer
// The Chrome stays open: capture scripts attach to it over CDP (see browser.mjs). Who the profile
// is goes to capture/profiles/<who>.json (gitignored), so redact.js knows what to swap.
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { ORIGIN } from './config.mjs'
import { attach, CHROME, PORTS, profileDir } from './browser.mjs'

const who = process.argv[2]
if (!PORTS[who]) throw new Error('usage: node capture/login.mjs you|reviewer')

spawn(CHROME, [`--user-data-dir=${profileDir(who)}`, `--remote-debugging-port=${PORTS[who]}`, '--no-first-run', '--no-default-browser-check', `${ORIGIN}/sites`], {
  detached: true,
  stdio: 'ignore',
}).unref()

console.log(`Sign in as the "${who}" account in the new Chrome window. Waiting…`)
for (;;) {
  await new Promise(r => setTimeout(r, 2500))
  const browser = await attach(who).catch(() => null)
  if (!browser) continue
  const page = browser.contexts()[0]?.pages().find(p => p.url().startsWith(ORIGIN))
  const me = page
    ? await page.evaluate(async () => {
        const r = await fetch('/api/me', { credentials: 'include' })
        return r.ok ? r.json() : null
      }).catch(() => null)
    : null
  await browser.close() // detaches; Chrome keeps running
  if (me?.email) {
    const file = new URL(`./profiles/${who}.json`, import.meta.url)
    await writeFile(file, JSON.stringify({ email: me.email, name: me.name, userSlug: me.userSlug, picture: me.picture }, null, 2))
    console.log(`Signed in. Saved capture/profiles/${who}.json. Leave that Chrome open.`)
    break
  }
}
