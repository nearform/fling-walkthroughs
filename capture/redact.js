// Runs inside every frame of a page before a screenshot. Swaps each real account's name, address,
// slug and picture for its persona, keeps doing so as the page changes, and reports anything that
// still looks private so the capture can refuse the shot.
//   window.__redact({ swaps: [{ email, name, slug, picture, persona: { name, email, initials } }],
//                     forbid: [{ label, source }, …] })  →  [problems]
window.__redact = ({ swaps, forbid }) => {
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const rules = []
  // whole addresses, then local parts (an address may be split across elements), then names
  for (const s of swaps) rules.push([new RegExp(reEsc(s.email), 'gi'), s.persona.email])
  for (const s of swaps) {
    const local = s.email.split('@')[0]
    // a capitalised local part is usually a name made from the address ("Clifton.x" → "Sam")
    const cap = local.replace(/^./, c => c.toUpperCase())
    if (local.length > 3) rules.push([new RegExp(`\\b${reEsc(cap)}\\b`, 'g'), s.persona.name.split(' ')[0]])
    if (local.length > 3) rules.push([new RegExp(`\\b${reEsc(local)}\\b`, 'gi'), s.persona.email.split('@')[0]])
    if (s.slug) rules.push([new RegExp(`\\b${reEsc(s.slug)}\\b`, 'gi'), s.persona.email.split('@')[0]])
  }
  for (const s of swaps) if (s.name) rules.push([new RegExp(reEsc(s.name), 'gi'), s.persona.name])
  for (const s of swaps) {
    if (!s.name) continue
    const parts = s.name.split(/\s+/)
    if (parts[0].length > 2) rules.push([new RegExp(`\\b${reEsc(parts[0])}\\b`, 'gi'), s.persona.name.split(' ')[0]])
    if (parts.length > 1 && parts.at(-1).length > 2) rules.push([new RegExp(`\\b${reEsc(parts.at(-1))}s?\\b`, 'gi'), s.persona.name.split(' ').at(-1)])
  }
  rules.push([/@(gmail|nearform)\.com\b/gi, '@example.com'])
  const swap = text => rules.reduce((t, [re, to]) => t.replace(re, to), text)
  window.__redactSwap = swap
  const ATTRS = ['title', 'alt', 'aria-label', 'placeholder', 'value', 'data-email', 'href']

  const initialsFor = img => {
    const near = `${img.alt} ${img.title} ${img.closest('[title]')?.title ?? ''}`
    const s = swaps.find(x => x.picture && img.src === x.picture) ?? swaps.find(x => near.includes(x.persona.name) || near.includes(x.persona.email))
    return s?.persona ?? swaps[0].persona
  }
  const fixImg = img => {
    if (!/googleusercontent|gravatar|avatar/i.test(img.src) && !swaps.some(s => s.picture && img.src === s.picture)) return
    const p = initialsFor(img)
    const r = img.getBoundingClientRect()
    const size = Math.max(r.width, r.height, 20)
    const span = document.createElement('span')
    span.textContent = p.initials
    span.setAttribute('aria-label', p.name)
    Object.assign(span.style, {
      display: 'inline-grid', placeItems: 'center', width: `${size}px`, height: `${size}px`, borderRadius: '50%',
      background: p.initials === 'SR' ? 'oklch(62% 0.2 255)' : 'oklch(65% 0.22 310)', color: 'white',
      font: `700 ${Math.round(size * 0.4)}px ui-sans-serif, system-ui`, flex: 'none', verticalAlign: 'middle',
    })
    img.replaceWith(span)
  }
  const fix = node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = swap(node.nodeValue)
      if (t !== node.nodeValue) node.nodeValue = t
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    for (const a of ATTRS) {
      const v = node.getAttribute?.(a)
      if (v) { const t = swap(v); if (t !== v) node.setAttribute(a, t) }
    }
    if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') { const t = swap(node.value); if (t !== node.value) node.value = t }
    if (node.tagName === 'IMG') fixImg(node)
    // collect first: replacing an avatar while walking would end the walk there
    const w = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
    const all = []
    for (let n = w.nextNode(); n; n = w.nextNode()) if (n !== node) all.push(n)
    for (const n of all) fixShallow(n)
  }
  const fixShallow = n => {
    if (n.nodeType === Node.TEXT_NODE) { const t = swap(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; return }
    for (const a of ATTRS) { const v = n.getAttribute(a); if (v) { const t = swap(v); if (t !== v) n.setAttribute(a, t) } }
    if (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA') { const t = swap(n.value); if (t !== n.value) n.value = t }
    if (n.tagName === 'IMG') fixImg(n)
  }
  fix(document.documentElement)
  // admin-only navigation: the tours show what a member sees
  for (const a of document.querySelectorAll('a[href^="/admin"]')) a.style.display = "none"
  document.title = swap(document.title)
  if (!window.__redactObserver) {
    window.__redactObserver = new MutationObserver(ms => {
      for (const m of ms) {
        if (m.type === 'characterData') fixShallow(m.target)
        else if (m.type === 'attributes') fixShallow(m.target)
        else for (const n of m.addedNodes) fix(n)
      }
    })
    window.__redactObserver.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS })
  }

  // what is still on the page that shouldn't be
  const html = `${document.documentElement.innerText}\n${[...document.querySelectorAll('*')].flatMap(e => ATTRS.map(a => e.getAttribute(a) ?? '')).join('\n')}\n${[...document.querySelectorAll('input,textarea')].map(e => e.value).join('\n')}`
  const problems = []
  for (const { label, source } of forbid) {
    const m = html.match(new RegExp(source, "i"))
    if (m) problems.push(`${label} → …${html.slice(Math.max(0, m.index - 30), m.index).replace(/\s+/g, " ")}███${html.slice(m.index + m[0].length, m.index + m[0].length + 30).replace(/\s+/g, " ")}…`)
  }
  return problems
}
