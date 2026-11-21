// Builds dist/<tour>/ for each tour (or the ones named): its page, scenes, shots and its own copy
// of the player, so each Path of the tour site stands alone. With no tours named it also builds the
// home page into dist-home/ (published as the site's root).
//   node build.mjs [--fling <address>] [tour…]
// --fling is the Fling the site is published on (default fling.labs.nearform.com). The tours were
// recorded on another Fling, so its address in the terminal lines, Claude's replies and the
// browser bar is swapped for this one, and painted over the screenshots where it appears there
// (tours/<id>/patches.json, made by capture/text-patches.mjs).
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { RECORDED_ON } from './capture/config.mjs'

const args = process.argv.slice(2)
const at = args.indexOf('--fling')
const FLING = at >= 0 ? args.splice(at, 2)[1] : 'fling.labs.nearform.com'
if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(FLING ?? '')) throw new Error('usage: node build.mjs [--fling <address, e.g. fling.labs.nearform.com>] [tour…]')
const SITE_URL = `https://fling-tour.${FLING}`
const swap = s => s.replaceAll(RECORDED_ON, FLING)

const all = readdirSync('tours').filter(t => existsSync(`tours/${t}/scenes.js`))
const tours = args.length ? args : all
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
  // text in the screenshots: paint the new address over the old (tours/<id>/patches.json)
  const pf = `tours/${t}/patches.json`
  let patches = ''
  if (FLING !== RECORDED_ON && existsSync(pf)) {
    const all = JSON.parse(readFileSync(pf, 'utf8'))
    for (const k of Object.keys(all)) all[k] = all[k].filter(p => !p.skip).map(p => ({ ...p, parts: p.parts.map(q => ({ ...q, from: q.text, text: swap(q.text) })) }))
    patches = `\nwindow.TOUR_PATCHES = ${JSON.stringify(all)}\n`
  }
  writeFileSync(`${out}/scenes.js`, swap(readFileSync(`tours/${t}/scenes.js`, 'utf8')) + patches)
  cpSync(`tours/${t}/shots`, `${out}/shots`, { recursive: true })
  for (const f of ['player.css', 'player.js', 'tours.js']) cpSync(`player/${f}`, `${out}/player/${f}`)
  console.log(`built ${out}`)
}

if (!args.length) {
  rmSync('dist-home', { recursive: true, force: true })
  mkdirSync('dist-home')
  writeFileSync('dist-home/index.html', readFileSync('home/index.html', 'utf8').replaceAll('{{site}}', SITE_URL))
  cpSync('player/player.css', 'dist-home/player.css')
  console.log('built dist-home')
}
console.log(`for ${FLING} (${SITE_URL})`)
