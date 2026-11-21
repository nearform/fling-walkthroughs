// Screenshots for "Get started", taken on the real Fling in two phases around the fix:
//   node tours/get-started/capture.mjs before   # sign-in page, live site, sites list, access, Ana's review
//   node tours/get-started/capture.mjs after    # the fixed site, the resolved threads
import { open, shoot } from '../../capture/shoot.mjs'
import { ORIGIN, SITES } from '../../capture/config.mjs'

const dir = new URL('./shots/', import.meta.url).pathname
const SITE = 'q3-support-report'
const siteUrl = `https://${SITE}.${SITES}/`
const review = `${ORIGIN}/review/${SITE}`
const phase = process.argv[2]
const only = process.argv[3]?.split(',')
const want = id => !only || only.includes(id)

if (phase === 'before') {
  // the web app's own instructions: install, then `fling setup` (the CLI sign-in page itself is
  // never shot: opened while signed in it approves at once and makes a key)
  if (want('get-started')) await shoot('you', { url: `${ORIGIN}/get-started`, file: `${dir}get-started.png` })
  if (want('site-live')) await shoot('you', { url: siteUrl, file: `${dir}site-live.png` })
  if (want('sites-list'))
    await shoot('you', {
      url: `${ORIGIN}/`,
      file: `${dir}sites-list.png`,
      act: async p => {
        await p.getByPlaceholder(/Search sites/).fill('q3-support')
        await p.waitForTimeout(800)
      },
    })
  if (want('site-access')) {
    const t = await open('you', `${ORIGIN}/sites/${SITE}`)
    const access = t.page.getByRole('tab', { name: /Access/ }).or(t.page.getByRole('link', { name: /^Access/ }))
    if (await access.count()) await access.first().click()
    await t.page.waitForTimeout(1000)
    await t.snap(`${dir}site-access.png`)
    await t.close()
  }
  if (want('review')) {
    const t = await open('reviewer', review)
    const p = t.page
    await p.waitForTimeout(2000)
    await t.snap(`${dir}review-open.png`)
    // a pin on the second "Aug", which should say "Sep"
    await p.keyboard.down('Alt')
    await p.mouse.click(449, 649)
    await p.keyboard.up('Alt')
    await p.waitForTimeout(800)
    await p.getByPlaceholder('What should change?').pressSequentially('This label should be Sep: the chart runs July to September.', { delay: 18 })
    await t.snap(`${dir}review-pin.png`)
    await p.getByRole('button', { name: 'Comment', exact: true }).click()
    await p.waitForTimeout(1500)
    // a passage: hold Alt and drag across it
    await p.keyboard.down('Alt')
    await p.mouse.move(238, 217)
    await p.mouse.down()
    await p.mouse.move(612, 218, { steps: 12 })
    await p.mouse.up()
    await p.keyboard.up('Alt')
    await p.waitForTimeout(800)
    await t.snap(`${dir}review-select.png`)
    const box = p.getByPlaceholder('What should change?')
    if (await box.count()) {
      await box.pressSequentially('How many is "most"? Give the number, so people don’t have to work it out from the table.', { delay: 12 })
      await p.getByRole('button', { name: 'Comment', exact: true }).click()
      await p.waitForTimeout(1500)
    }
    await t.snap(`${dir}review-comments.png`)
    await t.close()
  }
} else if (phase === 'after') {
  if (want('site-fixed')) await shoot('you', { url: siteUrl, file: `${dir}site-fixed.png` })
  if (want('review-resolved')) {
    const t = await open('you', review)
    await t.page.waitForTimeout(1500)
    const resolved = t.page.getByText('Resolved', { exact: true })
    if (await resolved.count()) await resolved.first().click()
    await t.page.waitForTimeout(1200)
    await t.snap(`${dir}review-resolved.png`)
    await t.close()
  }
} else {
  throw new Error('usage: node tours/get-started/capture.mjs before|after [ids]')
}
