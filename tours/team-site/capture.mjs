// Screenshots for "A team site, a Path per ticket", on the real payments-plans site.
//   node tours/team-site/capture.mjs [ids]
// Order matters: Ana's review and sign-offs come before the progress shot.
import { open, shoot } from '../../capture/shoot.mjs'
import { ORIGIN } from '../../capture/config.mjs'

const dir = new URL('./shots/', import.meta.url).pathname
const SITE = 'payments-plans'
const siteUrl = `https://${SITE}.infinitesoftwarefactory.com/`
const reviewOf = folder => `${ORIGIN}/review/${SITE}?path=${encodeURIComponent(`/${folder}/`)}`
const only = process.argv[2]?.split(',')
const want = id => !only || only.includes(id)

async function signOff(t, verdict, note) {
  const p = t.page
  await p.getByRole('tab', { name: /Sign-off/ }).or(p.getByRole('button', { name: /^Sign-off/ })).first().click()
  await p.waitForTimeout(800)
  await p.getByLabel(verdict, { exact: true }).or(p.getByText(verdict, { exact: true })).first().click()
  if (note) await p.locator('textarea').last().pressSequentially(note, { delay: 10 })
  await p.waitForTimeout(400)
}

if (want('home')) await shoot('you', { url: siteUrl, file: `${dir}home.png` })
if (want('ticket')) await shoot('you', { url: `${siteUrl}PAY-412/`, file: `${dir}ticket.png` })

if (want('review')) {
  const t = await open('reviewer', reviewOf('PAY-412'))
  const p = t.page
  await p.waitForTimeout(2000)
  // a pin on Week 3 of the rollout
  await p.keyboard.down('Alt')
  await p.mouse.click(396, 650)
  await p.keyboard.up('Alt')
  await p.waitForTimeout(800)
  await p.getByPlaceholder('What should change?').pressSequentially('What happens if recovery is below 25%? Say whether we roll back or keep the 50% split.', { delay: 12 })
  await t.snap(`${dir}review-pin.png`)
  await p.getByRole('button', { name: 'Comment', exact: true }).click()
  await p.waitForTimeout(1500)
  await signOff(t, 'Needs changes', 'Good plan. Just say what we do if Week 3 misses the 25% bar.')
  await t.snap(`${dir}signoff.png`)
  await p.getByRole('button', { name: /^Save/ }).first().click()
  await p.waitForTimeout(1500)
  await t.snap(`${dir}signoff-saved.png`)
  await t.close()
}

if (want('approve')) {
  const t = await open('reviewer', reviewOf('PAY-431'))
  await t.page.waitForTimeout(1500)
  await signOff(t, 'Approve', '')
  await t.page.getByRole('button', { name: /^Save/ }).first().click()
  await t.page.waitForTimeout(1500)
  await t.close()
}

if (want('progress')) await shoot('you', { url: `${ORIGIN}/sites/${SITE}/responses`, file: `${dir}progress.png` })

if (want('paths')) {
  const t = await open('you', `${ORIGIN}/sites/${SITE}`)
  const tab = t.page.getByRole('tab', { name: /Versions/ }).or(t.page.getByRole('link', { name: /^Versions/ }))
  if (await tab.count()) await tab.first().click()
  await t.page.waitForTimeout(1200)
  const paths = t.page.getByRole('heading', { name: /^Paths/ })
  if (await paths.count()) await paths.first().scrollIntoViewIfNeeded()
  await t.page.waitForTimeout(500)
  await t.snap(`${dir}paths.png`)
  await t.close()
}
