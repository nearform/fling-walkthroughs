// Takes one redacted screenshot as one of the capture profiles.
//   await shoot('you', { url, file, act?: async page => {}, full?, keep? })
// It opens a tab in that profile's running Chrome (see login.mjs), sizes it to 1440×900 at 2×,
// runs `act`, redacts every frame, refuses the shot if anything private remains, and saves it.
import { readFileSync, existsSync } from 'node:fs'
import { attach } from './browser.mjs'
import { PERSONAS } from './config.mjs'

const REDACT = readFileSync(new URL('./redact.js', import.meta.url), 'utf8')
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function swaps() {
  const out = []
  for (const who of ['you', 'reviewer']) {
    const f = new URL(`./profiles/${who}.json`, import.meta.url)
    if (!existsSync(f)) continue
    const p = JSON.parse(readFileSync(f, 'utf8'))
    out.push({ email: p.email, name: p.name, slug: p.userSlug, picture: p.picture, persona: PERSONAS[who] })
  }
  return out
}

function forbidden(sw) {
  const f = [
    { label: 'a gmail address', source: '[a-z0-9._%+-]+@gmail\\.com' },
    { label: 'a nearform address', source: '[a-z0-9._%+-]+@nearform\\.com' },
    { label: 'an Anthropic key', source: 'sk-ant-[A-Za-z0-9_-]{8,}' },
    { label: 'a Fling key', source: '\\bfling_(?=[a-z0-9_-]*[A-Z0-9-])[A-Za-z0-9_-]{12,}' },
    { label: 'a JWT', source: 'eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}' },
  ]
  for (const [i, s] of sw.entries()) {
    f.push({ label: `account ${i + 1}'s address`, source: reEsc(s.email) })
    if (s.name) f.push({ label: `account ${i + 1}'s name`, source: `\\b${reEsc(s.name.split(/\s+/).at(-1))}\\b` })
  }
  return f
}

export async function redactPage(page) {
  const sw = swaps()
  const forbid = forbidden(sw)
  const problems = []
  for (const frame of page.frames()) {
    try {
      await frame.evaluate(REDACT)
      problems.push(...(await frame.evaluate(cfg => window.__redact(cfg), { swaps: sw, forbid })))
    } catch (e) {
      problems.push(`frame ${new URL(frame.url()).host}: ${e.message.split('\n')[0]}`)
    }
  }
  return problems
}

export async function shoot(who, { url, file, act, waitFor, full = false, wait = 900, scale = 2, width = 1440, height = 900 }) {
  const browser = await attach(who)
  const ctx = browser.contexts()[0]
  const page = await ctx.newPage()
  try {
    await page.bringToFront()
    const cdp = await ctx.newCDPSession(page)
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false })
    if (url) await page.goto(url, { waitUntil: 'networkidle' }).catch(() => page.waitForLoadState('load'))
    if (waitFor) await page.waitForSelector(waitFor, { timeout: 20000 })
    else await page.waitForFunction(() => document.body?.innerText.trim().length > 20, null, { timeout: 20000 })
    await page.waitForTimeout(wait)
    if (act) await act(page)
    await redactPage(page)
    await page.waitForTimeout(250)
    const problems = await redactPage(page)
    if (problems.length) throw new Error(`not saving ${file}: ${problems.join('; ')}`)
    await page.screenshot({ path: file, fullPage: full, animations: 'disabled', caret: 'hide' })
    console.log(`✓ ${file}`)
  } finally {
    await page.close()
    await browser.close()
  }
}

/**
 * A tab to work in step by step: `snap(file)` redacts and saves, `close()` closes the tab.
 *   const t = await open('reviewer', url); await t.page.click(…); await t.snap('shots/x.png'); await t.close()
 */
export async function open(who, url, { scale = 2, width = 1440, height = 900, waitFor } = {}) {
  const browser = await attach(who)
  const ctx = browser.contexts()[0]
  const page = await ctx.newPage()
  await page.bringToFront()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false })
  if (url) await page.goto(url, { waitUntil: 'networkidle' }).catch(() => page.waitForLoadState('load'))
  if (waitFor) await page.waitForSelector(waitFor, { timeout: 20000 })
  else await page.waitForFunction(() => document.body?.innerText.trim().length > 20, null, { timeout: 20000 })
  await page.waitForTimeout(900)
  return {
    page,
    async snap(file, { full = false } = {}) {
      await redactPage(page)
      await page.waitForTimeout(250)
      const problems = await redactPage(page)
      if (problems.length) throw new Error(`not saving ${file}: ${problems.join('; ')}`)
      await page.screenshot({ path: file, fullPage: full, animations: 'disabled', caret: 'hide' })
      console.log(`✓ ${file}`)
    },
    async close() {
      await page.close()
      await browser.close()
    },
  }
}
