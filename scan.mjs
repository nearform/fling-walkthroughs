// Refuses to publish dist/ if any text file holds something private: real addresses or names of
// the capture accounts, gmail/nearform addresses, keys, tokens, this machine's name or home folder.
// Screenshots are checked when they are taken (capture/redact.js refuses the shot).
//   node scan.mjs [dir]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir, hostname } from 'node:os'
import { join } from 'node:path'

const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const checks = [
  ['a gmail address', /[a-z0-9._%+-]+@gmail\.com/i],
  ['a nearform address', /[a-z0-9._%+-]+@nearform\.com/i],
  ['an Anthropic key', /sk-ant-[A-Za-z0-9_-]{8,}/],
  ['a Fling key', /\bfling_(?=[a-z0-9_-]*[A-Z0-9-])[A-Za-z0-9_-]{12,}/],
  ['a JWT', /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ['this machine', new RegExp(reEsc(hostname().replace(/\.local$/, '')), 'i')],
  ['the home folder', new RegExp(reEsc(homedir()))],
]
for (const who of ['you', 'reviewer']) {
  const f = `capture/profiles/${who}.json`
  if (!existsSync(f)) continue
  const p = JSON.parse(readFileSync(f, 'utf8'))
  checks.push([`${who}'s address`, new RegExp(reEsc(p.email), 'i')])
  for (const part of (p.name ?? '').split(/\s+/).filter(x => x.length > 2)) checks.push([`${who}'s name`, new RegExp(`\\b${reEsc(part)}\\b`, 'i')])
  if (p.userSlug) checks.push([`${who}'s slug`, new RegExp(`\\b${reEsc(p.userSlug)}\\b`)])
}
const root = process.argv[2] ?? 'dist'
const files = []
const walk = d => { for (const e of readdirSync(d)) { const p = join(d, e); statSync(p).isDirectory() ? walk(p) : files.push(p) } }
walk(root)
let bad = 0
for (const f of files.filter(f => /\.(html|js|css|json|md|txt|csv|jsonl)$/.test(f))) {
  const text = readFileSync(f, 'utf8')
  for (const [label, re] of checks) {
    const m = re.exec(text)
    if (m) { bad++; console.log(`✖ ${f}: ${label} (line ${text.slice(0, m.index).split('\n').length})`) }
  }
}
console.log(bad ? `${bad} problem(s): not safe to publish` : `✔ ${files.length} files clean`)
process.exitCode = bad ? 1 : 0
