// The capture Chromes: one ordinary Chrome per profile, started by login.mjs, attached over CDP.
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

export const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
export const PORTS = { you: 9341, reviewer: 9342 }
export const profileDir = who => fileURLToPath(new URL(`./profiles/${who}-chrome`, import.meta.url))

/** Attach to a profile's running Chrome. `browser.close()` detaches and leaves it running. */
export const attach = who => chromium.connectOverCDP(`http://127.0.0.1:${PORTS[who]}`)
