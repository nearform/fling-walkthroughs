// Finds the recorded Fling's address in every screenshot and writes tours/<id>/patches.json, so a
// build for another Fling can paint the new address over it (build.mjs, player.js). Run it after
// retaking shots. Needs macOS (Vision, via capture/find-text.swift).
//   node capture/text-patches.mjs [tour…]
// Each patch: { box: [x, y, w, h] in % of the 16:10 view (as ring/cursor), parts: [{ text, mono, dim? }]
// (the word with the address, then the rest of its line), fg, bg }. Edit a patch by hand if a guess
// is off (mono, or text Vision misread): a rerun keeps patches whose text is unchanged. A patch with
// "skip": true is left alone.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { RECORDED_ON } from './config.mjs'

const bin = 'tmp/find-text'
mkdirSync('tmp', { recursive: true })
if (!existsSync(bin)) execFileSync('swiftc', ['-O', '-o', bin, 'capture/find-text.swift'], { stdio: 'inherit' })

const tours = process.argv.length > 2 ? process.argv.slice(2) : readdirSync('tours').filter(t => existsSync(`tours/${t}/shots`))
const r1 = v => +v.toFixed(2)
for (const t of tours) {
  const dir = `tours/${t}/shots`
  const files = readdirSync(dir).filter(f => f.endsWith('.png')).map(f => `${dir}/${f}`)
  const out = execFileSync(bin, [RECORDED_ON, ...files], { encoding: 'utf8', maxBuffer: 1 << 24 })
  const old = existsSync(`tours/${t}/patches.json`) ? JSON.parse(readFileSync(`tours/${t}/patches.json`, 'utf8')) : {}
  const patches = {}
  for (const m of out.trim().split('\n').filter(Boolean).map(l => JSON.parse(l))) {
    const [W] = m.image, viewH = W * 10 / 16
    const [x, y, w, h] = m.box
    const [word, ...more] = m.text.split(/(?<=\S)\s+/)
    // Vision reads trailing icons as letters ("… .com C f"): keep only real words after the address
    const rest = more.join(' ').replace(/(^|\s+)\S{1,2}(?=\s|$)/g, ' ').replace(/(\s+\S{1,2})+\s*$/, '').trim()
    const shown = rest ? `${word} ${rest}` : word
    const keep = Math.min(1, shown.length / m.text.length)
    // a guess: addresses are code, unless they are links (blue); fix by hand if wrong
    const bluish = parseInt(m.fg.slice(5, 7), 16) - parseInt(m.fg.slice(1, 3), 16) > 60
    // a shell prompt Vision ran into the address ("$https://…"): its own part, dimmed as on screen
    const prompt = /^\$(?=\S)/.test(word)
    const parts = prompt ? [{ text: '$ ', mono: true, dim: true }, { text: word.slice(1), mono: true }] : [{ text: word, mono: !bluish }]
    if (rest) parts.push({ text: ' ' + rest, mono: false })
    const shot = m.file.split('/').pop()
    const prev = old[shot]?.find(p => p.parts?.map(q => q.text).join('') === parts.map(q => q.text).join(''))
    ;(patches[shot] ??= []).push(prev ?? {
      box: [r1(x / W * 100), r1(y / viewH * 100), r1(w * keep / W * 100), r1(h / viewH * 100)],
      parts, fg: m.fg, bg: m.bg,
    })
  }
  writeFileSync(`tours/${t}/patches.json`, JSON.stringify(patches, null, 1) + '\n')
  console.log(`${t}: ${Object.values(patches).flat().length} patches in ${Object.keys(patches).length} shots`)
}
