// Screenshots for "Just ask Claude": the connector, a page Claude made and published, Ana's
// comment, and the fix.
//   node tours/claude-app/capture.mjs getstarted|consent|live|review|after
import { createHash, randomBytes } from 'node:crypto'
import { open, shoot } from '../../capture/shoot.mjs'
import { ORIGIN, SITES } from '../../capture/config.mjs'
import { measure } from '../../capture/measure.mjs'

const dir = new URL('./shots/', import.meta.url).pathname
const SITE = 'pricing-launch'
const siteUrl = `https://${SITE}.${SITES}/`
const review = `${ORIGIN}/review/${SITE}`
const phase = process.argv[2]

if (phase === 'getstarted') {
  const t = await open('you', `${ORIGIN}/get-started`)
  await t.page.getByText('Add to Claude (Desktop, web, mobile)').scrollIntoViewIfNeeded()
  await t.page.evaluate(() => window.scrollBy(0, -90))
  await t.page.waitForTimeout(600)
  await t.snap(`${dir}get-started.png`)
  const p = t.page
  console.log('get-started', JSON.stringify(await measure(p, {
    step: p.getByText('Add to Claude (Desktop, web, mobile)'),
    url: p.getByText(new RegExp(`${SITES.replaceAll('.', '\\.')}/mcp$`)),
  })))
  await t.close()
}

if (phase === 'consent') {
  // the page Fling shows when Claude connects: register as Claude's connector does, open the
  // authorize page as Sam and stop there (never Allow, so no connection is made)
  const reg = await fetch(`${ORIGIN}/oauth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_name: 'Claude',
      redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    }),
  }).then(r => r.json())
  if (!reg.client_id) throw new Error(`register refused: ${reg.error}`)
  const verifier = randomBytes(32).toString('base64url')
  const q = new URLSearchParams({
    response_type: 'code',
    client_id: reg.client_id,
    redirect_uri: 'https://claude.ai/api/mcp/auth_callback',
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
    state: randomBytes(12).toString('base64url'),
    scope: 'fling',
    resource: `${ORIGIN}/mcp`,
  })
  const t = await open('you', `${ORIGIN}/oauth/authorize?${q}`)
  await t.page.waitForTimeout(1500)
  await t.snap(`${dir}consent.png`)
  console.log('consent', JSON.stringify(await measure(t.page, {
    allow: t.page.getByRole('button', { name: 'Allow' }),
    title: t.page.getByText(/wants to use Fling/),
  })))
  await t.close()
}

if (phase === 'live') await shoot('you', { url: siteUrl, file: `${dir}live.png` })

if (phase === 'review-measure') {
  // the same selection as 'review', measured and then cancelled: nothing is posted
  const t = await open('reviewer', review)
  const p = t.page
  await p.waitForTimeout(2000)
  const frame = p.frames().find(f => f.url().startsWith(siteUrl) && !f.url().includes('/_fling/'))
  const r = await frame.evaluate(words => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const i = n.nodeValue.indexOf(words)
      if (i < 0) continue
      const range = document.createRange()
      range.setStart(n, i)
      range.setEnd(n, i + words.length)
      const b = range.getBoundingClientRect()
      return { x: b.left, y: b.top, w: b.width, h: b.height }
    }
  }, '30 days before their next renewal')
  const off = await (await frame.frameElement()).boundingBox()
  const pc = (v, d) => +(v / d * 100).toFixed(1)
  console.log('passage', JSON.stringify({ ring: [pc(off.x + r.x - 6, 1440), pc(off.y + r.y - 5, 900), pc(r.w + 12, 1440), pc(r.h + 10, 900)], end: [pc(off.x + r.x + r.w, 1440), pc(off.y + r.y + r.h / 2, 900)] }))
  const y = off.y + r.y + r.h / 2
  await p.mouse.move(off.x + r.x + 1, y)
  await p.mouse.down()
  await p.mouse.move(off.x + r.x + r.w - 1, y, { steps: 8 })
  await p.mouse.up()
  await p.waitForTimeout(900)
  console.log('composer', JSON.stringify(await measure(p, {
    box: p.getByPlaceholder('What should change?'),
    comment: p.getByRole('button', { name: 'Comment', exact: true }),
  })))
  await p.getByRole('button', { name: 'Cancel', exact: true }).click()
  await t.close()
}

if (phase === 'review') {
  const t = await open('reviewer', review)
  const p = t.page
  await p.waitForTimeout(2000)
  const frame = p.frames().find(f => f.url().startsWith(siteUrl) && !f.url().includes('/_fling/'))
  const r = await frame.evaluate(words => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const i = n.nodeValue.indexOf(words)
      if (i < 0) continue
      const range = document.createRange()
      range.setStart(n, i)
      range.setEnd(n, i + words.length)
      const b = range.getBoundingClientRect()
      return { x: b.left, y: b.top, w: b.width, h: b.height }
    }
  }, '7 days before their next renewal')
  const off = await (await frame.frameElement()).boundingBox()
  const y = off.y + r.y + r.h / 2
  await p.mouse.move(off.x + r.x + 1, y)
  await p.mouse.down()
  await p.mouse.move(off.x + r.x + r.w - 1, y, { steps: 16 })
  await p.mouse.up()
  await p.waitForTimeout(900)
  const box = p.getByPlaceholder('What should change?')
  await box.pressSequentially('Our terms need 30 days’ notice of a price rise (section 4.2), so 7 days isn’t enough. Can we make it 30?', { delay: 10 })
  await p.waitForTimeout(300)
  await t.snap(`${dir}review-select.png`)
  await p.getByRole('button', { name: 'Comment', exact: true }).click()
  await p.waitForTimeout(1500)
  await t.snap(`${dir}review-comment.png`)
  await t.close()
}

if (phase === 'after') {
  const f = await open('you', siteUrl)
  await f.page.waitForTimeout(800)
  await f.snap(`${dir}fixed.png`)
  console.log('fixed', JSON.stringify(await measure(f.page, { notice: f.page.locator('#notice'), label: f.page.getByText('from 2 January', { exact: false }) })))
  await f.close()
  const t = await open('you', review)
  await t.page.waitForTimeout(1500)
  const resolved = t.page.getByText('Resolved', { exact: true })
  if (await resolved.count()) await resolved.first().click()
  await t.page.waitForTimeout(1200)
  await t.snap(`${dir}resolved.png`)
  console.log('resolved', JSON.stringify(await measure(t.page, { thread: t.page.getByText('Our terms need 30 days', { exact: false }), resolved: t.page.getByText('Resolved', { exact: true }) })))
  await t.close()
}
