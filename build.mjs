// Builds dist/<tour>/ for each tour (or the ones named): its page, scenes, shots and its own copy
// of the player, so each Path of the tour site stands alone. og:image needs an absolute URL.
//   node build.mjs [tour…]
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

const SITE_URL = 'https://fling-tour.infinitesoftwarefactory.com'
const all = readdirSync('tours').filter(t => existsSync(`tours/${t}/scenes.js`))
const tours = process.argv.length > 2 ? process.argv.slice(2) : all
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const page = readFileSync('player/page.html', 'utf8')

for (const t of tours) {
  const out = `dist/${t}`
  rmSync(out, { recursive: true, force: true })
  mkdirSync(`${out}/player`, { recursive: true })
  const meta = JSON.parse(readFileSync(`tours/${t}/tour.json`, 'utf8'))
  writeFileSync(`${out}/index.html`, page
    .replaceAll('{{title}}', esc(meta.title))
    .replaceAll('{{description}}', esc(meta.description))
    .replaceAll('{{poster}}', `${SITE_URL}/${t}/${meta.poster}`))
  cpSync(`tours/${t}/scenes.js`, `${out}/scenes.js`)
  cpSync(`tours/${t}/shots`, `${out}/shots`, { recursive: true })
  for (const f of ['player.css', 'player.js', 'tours.js']) cpSync(`player/${f}`, `${out}/player/${f}`)
  console.log(`built ${out}`)
}
