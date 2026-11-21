// Labels the support-evals samples for real, as Ana (8 of 12) and Sam (all 12), and takes the
// screenshots for "Label an eval set" on the way.
//   node tours/eval-labelling/capture.mjs [ids]   ids: ana, flag, sam, progress, home
import { open, shoot } from '../../capture/shoot.mjs'
import { ORIGIN, SITES } from '../../capture/config.mjs'

const dir = new URL('./shots/', import.meta.url).pathname
const SITE = 'support-evals'
const reviewOf = id => `${ORIGIN}/review/${SITE}?path=${encodeURIComponent(`/s/${id}/`)}`
const only = process.argv[2]?.split(',')
const want = id => !only || only.includes(id)

const VERDICT = { pass: 'Pass: right and follows the policy', partial: 'Partial: right, but misses something', fail: 'Fail: wrong, made up or harmful' }
const PROBLEM = { made_up: 'Made something up', wrong_policy: 'Contradicts the policy', missed: "Didn't answer the question", tone: 'Wrong tone', none: 'Nothing' }

const ana = [
  ['s01', 'pass', 'none'],
  ['s02', 'pass', 'none'],
  ['s03', 'fail', 'made_up', 'We only see the decline code. It can’t know the bank flagged fraud.'],
  ['s04', 'pass', 'none'],
  ['s05', 'fail', 'missed', 'Asked how to cancel; got a pitch for pausing and no steps.'],
  ['s06', 'pass', 'none'],
  ['s07', 'fail', 'wrong_policy', '99.99% on every plan is wrong: Starter has no SLA.'],
  ['s08', 'pass', 'none'],
]
const sam = [
  ['s01', 'pass', 'none'], ['s02', 'pass', 'none'],
  ['s03', 'fail', 'made_up', 'Invents a reason for the decline.'],
  ['s04', 'pass', 'none'],
  ['s05', 'partial', 'missed', 'Pausing is fine to mention, but the steps to cancel are missing.'],
  ['s06', 'pass', 'none'],
  ['s07', 'fail', 'wrong_policy', 'Wrong SLA figure.'],
  ['s08', 'pass', 'none'], ['s09', 'pass', 'none'],
  ['s10', 'partial', 'wrong_policy', 'Backups are in Dublin and support can access from the UK.'],
  ['s11', 'pass', 'none'],
  ['s12', 'fail', 'tone', 'Scolds the customer.'],
]

async function labelsTab(p) {
  await p.getByRole('tab', { name: /Labels/ }).or(p.getByRole('button', { name: /^Labels/ })).first().click()
  await p.getByRole('radio', { name: VERDICT.pass }).waitFor({ timeout: 15000 })
  await p.waitForTimeout(400)
}
async function answer(p, [, verdict, problem, note]) {
  await p.getByRole('radio', { name: VERDICT[verdict] }).check()
  await p.getByRole('radio', { name: PROBLEM[problem] }).check()
  if (note) await p.locator('textarea').last().pressSequentially(note, { delay: 8 })
  await p.waitForTimeout(300)
}
async function saveAndNext(p) {
  await p.getByRole('button', { name: /Save and next/ }).click()
  await p.waitForTimeout(1600)
  await p.getByRole('radio', { name: VERDICT.pass }).waitFor({ timeout: 15000 }).catch(() => {})
}

if (want('home')) await shoot('reviewer', { url: `https://${SITE}.${SITES}/`, file: `${dir}home.png` })

if (want('ana')) {
  const t = await open('reviewer', reviewOf('s01'))
  const p = t.page
  await p.waitForTimeout(1500)
  await labelsTab(p)
  for (const row of ana) {
    await answer(p, row)
    if (row[0] === 's01') await t.snap(`${dir}label-pass.png`)
    if (row[0] === 's03') await t.snap(`${dir}label-fail.png`)
    await saveAndNext(p)
    if (row[0] === 's03') await t.snap(`${dir}label-next.png`)
  }
  await t.close()
}

if (want('flag')) {
  // a comment-type form on the passage with the wrong figure
  const t = await open('reviewer', reviewOf('s07'))
  const p = t.page
  await p.waitForTimeout(1500)
  const frame = p.frames().find(f => f.url().includes('/s/s07/'))
  // where the words sit, in the page's coordinates: the range in the frame plus the frame's offset
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
  }, '99.99% uptime on every plan')
  const off = await (await frame.frameElement()).boundingBox()
  const y = off.y + r.y + r.h / 2
  await p.mouse.move(off.x + r.x + 1, y)
  await p.mouse.down()
  await p.mouse.move(off.x + r.x + r.w - 1, y, { steps: 16 })
  await p.mouse.up()
  await p.waitForTimeout(900)
  await p.getByRole('button', { name: 'Flag a passage' }).or(p.getByRole('tab', { name: 'Flag a passage' })).first().click()
  await p.waitForTimeout(600)
  await p.getByText('Blocker: must fix before release', { exact: true }).click()
  await p.locator('textarea').last().pressSequentially('Promises an SLA we don’t offer. Customers could claim credits on Starter.', { delay: 10 })
  await p.waitForTimeout(400)
  await t.snap(`${dir}flag.png`)
  await p.getByRole('button', { name: 'Post', exact: true }).click()
  await p.waitForTimeout(1500)
  await t.snap(`${dir}flag-posted.png`)
  await t.close()
}

if (want('sam')) {
  // page by page: Save and next goes to the next page Sam hasn't answered, so a rerun would drift
  const t = await open('you', reviewOf('s01'))
  const p = t.page
  for (const row of sam) {
    await p.goto(reviewOf(row[0]), { waitUntil: 'networkidle' })
    await p.waitForTimeout(1200)
    await labelsTab(p)
    await p.locator('textarea').last().fill('')
    await answer(p, row)
    await p.getByRole('button', { name: 'Save', exact: true }).click()
    await p.waitForTimeout(1400)
  }
  await t.snap(`${dir}label-sam-done.png`)
  await t.close()
}

if (want('progress')) await shoot('you', { url: `${ORIGIN}/sites/${SITE}/responses`, file: `${dir}progress.png` })
