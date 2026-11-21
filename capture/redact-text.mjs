// Redacts a transcript (stdin → stdout, or a function): real addresses, names and slugs become the
// personas; host names, local paths, key prefixes, OAuth state and long ids are replaced.
import { existsSync, readFileSync } from 'node:fs'
import { hostname, homedir } from 'node:os'
import { PERSONAS } from './config.mjs'

const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function redactText(text) {
  for (const who of ['you', 'reviewer']) {
    const f = new URL(`./profiles/${who}.json`, import.meta.url)
    if (!existsSync(f)) continue
    const p = JSON.parse(readFileSync(f, 'utf8'))
    const to = PERSONAS[who]
    text = text.replace(new RegExp(reEsc(p.email), 'gi'), to.email)
    if (p.name) text = text.replace(new RegExp(reEsc(p.name), 'gi'), to.name)
    if (p.userSlug) text = text.replace(new RegExp(`\\b${reEsc(p.userSlug)}\\b`, 'g'), to.email.split('@')[0])
  }
  const host = hostname().replace(/\.local$/, '')
  return text
    .replace(new RegExp(reEsc(host), 'gi'), 'sams-mac')
    .replace(/[A-Za-z0-9._%+-]+@(gmail|nearform)\.com/gi, 'someone@example.com')
    .replace(/\/Users\/[^/\s]+\/work\/fling-walkthroughs\/tmp\/fresh-home/g, '~')
    .replace(/\/Users\/[^/\s]+\/work\/fling-walkthroughs\/demos/g, '~/work')
    .replace(new RegExp(reEsc(homedir()), 'g'), '~')
    .replace(/\bfling_[A-Za-z0-9_-]{2,}…?/g, 'fling_••••…')
    .replace(/sk-ant-[A-Za-z0-9_-]+/g, 'sk-ant-••••')
    .replace(/state=[0-9a-f]{16,}/g, 'state=••••')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let input = ''
  for await (const chunk of process.stdin) input += chunk
  process.stdout.write(redactText(input))
}
