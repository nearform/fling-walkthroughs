// Screenshots for "A site that does real work": the triage desk under fling dev, then live.
//   node tours/site-server/capture.mjs local|live|server
import { open } from '../../capture/shoot.mjs'
import { ORIGIN } from '../../capture/config.mjs'
import { measure } from '../../capture/measure.mjs'

const dir = new URL('./shots/', import.meta.url).pathname
const SITE = 'triage-desk'
const phase = process.argv[2]

async function triage(url, sample, file, as = 'you') {
  const t = await open(as, url)
  const p = t.page
  await p.getByRole('button', { name: sample }).click()
  await p.waitForTimeout(400)
  await t.snap(file.replace('.png', '-ticket.png'))
  await p.getByRole('button', { name: 'Triage it' }).click()
  await p.getByText(/Done in/).waitFor({ timeout: 60000 })
  await p.waitForTimeout(500)
  await t.snap(file)
  console.log(file.split('/').pop(), JSON.stringify(await measure(p, {
    go: p.getByRole('button', { name: 'Triage it' }), out: p.locator('#out'), chips: p.locator('#out .chips'),
  })))
  await t.close()
}

if (phase === 'local') await triage('http://localhost:47180/', 'Export bug', `${dir}local-result.png`)
if (phase === 'live') await triage(`https://${SITE}.infinitesoftwarefactory.com/`, 'Double charge', `${dir}live-result.png`)
if (phase === 'server') {
  const t = await open('you', `${ORIGIN}/sites/${SITE}`)
  const tab = t.page.getByRole('tab', { name: /Server/ }).or(t.page.getByRole('link', { name: /^Server/ }))
  await tab.first().click()
  await t.page.waitForTimeout(1200)
  await t.page.getByRole('heading', { name: 'Server', exact: true }).evaluate(h => { h.scrollIntoView({ block: 'start' }); window.scrollBy(0, -110) })
  await t.page.waitForTimeout(600)
  await t.snap(`${dir}server-tab.png`)
  console.log('server-tab', JSON.stringify(await measure(t.page, {
    heading: t.page.getByRole('heading', { name: 'Server', exact: true }),
    answers: t.page.getByText('Answers', { exact: true }),
    limits: t.page.getByText('Limits', { exact: true }),
    last: t.page.getByText('Requests a second', { exact: false }),
  })))
  await t.close()
}
