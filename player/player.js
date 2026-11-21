// The walkthrough player. A tour page loads scenes.js (window.TOUR) and then this file, which
// draws the caption, the terminal, the browser and the controls, and plays the steps in order.
//
// The tour: window.TOUR = { id, title, titleHtml (the problem, as a headline), eyebrow, problem, lead (the how),
//   chips, outro, endTitle, personas, steps }
//
// A step:
//   { chapter, caption, note?, layout?: 'split'|'term'|'shot',
//     term?:  { kind: 'claude'|'shell'|'chat', title?, clear?, lines: [Line] },  (chat: Claude's app, not a terminal)
//     shot?:  { src, url, as?: 'you'|'reviewer', cursor?: [x, y], click?, ring?: [x, y, w, h],
//               zoom?: [x, y, scale] },              // all positions in % of the screenshot
//     hold?: ms }
// A Line is one of { user }, { cmd }, { out, tone? }, { say }, { tool, args? }, { res }, { ask, options, pick }.
// The terminal keeps what earlier steps printed (unless `clear`); a step without `shot` keeps the
// last screenshot.
;(() => {
  const TOUR = window.TOUR
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const $ = (tag, props = {}, ...kids) => {
    const el = Object.assign(document.createElement(tag), props)
    for (const k of kids) el.append(k)
    return el
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

  // A title card first and an end card last, around the tour's own steps.
  const steps = [
    { chapter: 'Intro', caption: TOUR.title, layout: 'card', card: 'intro' },
    ...TOUR.steps,
    { chapter: 'Next', caption: 'That’s the tour', note: TOUR.outro, layout: 'card', card: 'end' },
  ]

  // ---------- the page ----------
  const root = document.getElementById('tour')
  root.className = 'tour'
  const caption = $('header', { className: 'caption' })
  const termTitle = $('span', { className: 't' })
  const termBody = $('div', { className: 'term-body', role: 'log', ariaLive: 'off' })
  const term = $('section', { className: 'term', ariaLabel: 'Terminal' },
    $('div', { className: 'term-bar' }, $('span', { className: 'lights', innerHTML: '<i></i><i></i><i></i>' }), termTitle),
    termBody)
  const url = $('div', { className: 'url' })
  const pan = $('div', { className: 'pan' })
  const ring = $('div', { className: 'ring' })
  const cursor = $('div', {
    className: 'cursor',
    innerHTML: '<span class="pulse"></span><svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 2l15 9.5-6.6 1.3 4 7.6-3 1.6-4-7.7L4 19z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  })
  const persona = $('div', { className: 'persona' })
  pan.append(ring, cursor)
  const view = $('div', { className: 'view' }, pan, persona)
  const browser = $('section', { className: 'browser', ariaLabel: 'Browser' },
    $('div', { className: 'browser-bar' }, $('span', { className: 'lights', innerHTML: '<i></i><i></i><i></i>' }), url),
    view)
  const cardSlot = $('section', { className: 'card-slot' })
  const stage = $('div', { className: 'stage' }, term, browser, cardSlot)

  const playBtn = $('button', { className: 'play', ariaLabel: 'Play' })
  const prevBtn = $('button', { className: 'icon-btn', ariaLabel: 'Previous step', innerHTML: '‹' })
  const nextBtn = $('button', { className: 'icon-btn', ariaLabel: 'Next step', innerHTML: '›' })
  const count = $('span', { className: 'count' })
  const chapters = $('div', { className: 'chapters' })
  const segs = $('div', { className: 'segs' })
  const controls = $('nav', { className: 'controls', ariaLabel: 'Walkthrough controls' },
    playBtn, prevBtn, nextBtn, $('div', { className: 'track' }, chapters, segs), count)

  const theme = $('button', { className: 'icon-btn', ariaLabel: 'Switch light or dark', innerHTML: '◐' })
  theme.onclick = () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.dataset.theme = dark ? 'light' : 'dark'
  }
  const top = $('div', { className: 'top' },
    $('a', { className: 'brand', href: TOUR.home ?? '../', innerHTML: '<i></i>Fling tours' }),
    $('span', { className: 'title', textContent: TOUR.short ?? TOUR.title }),
    $('span', { className: 'spacer' }), theme)
  root.append(top, caption, stage, controls)

  // chapters, sized by how many steps each has
  const chapterOf = []
  for (const [i, s] of steps.entries()) {
    const last = chapterOf.at(-1)
    if (last && last.name === s.chapter) last.n++
    else chapterOf.push({ name: s.chapter, first: i, n: 1 })
  }
  for (const c of chapterOf) {
    const b = $('button', { textContent: c.name })
    b.style.setProperty('--n', c.n)
    b.onclick = () => go(c.first, playing)
    c.el = b
    chapters.append(b)
  }
  const segEls = steps.map((s, i) => {
    const b = $('button', { ariaLabel: `Step ${i + 1}: ${s.caption}` })
    b.onclick = () => go(i, playing)
    segs.append(b)
    return b
  })

  // ---------- the cards ----------
  const tourLinks = () => {
    const wrap = $('div', { className: 'next-tours' })
    for (const t of TOUR.tours ?? []) {
      const a = $('a', { href: t.href, innerHTML: `<b>${esc(t.title)}</b><span>${esc(t.blurb)}</span>` })
      if (t.id === TOUR.id) a.setAttribute('aria-current', 'page')
      wrap.append(a)
    }
    return wrap
  }
  const drawCard = kind => {
    const inner = $('div', { className: 'card-inner' })
    if (kind === 'intro') {
      // problem first: the headline and why it hurts, then how the walkthrough solves it
      inner.innerHTML = `<span class="eyebrow">${esc(TOUR.eyebrow ?? 'A Fling walkthrough')} · ${esc(TOUR.title)}</span>
        <h1>${TOUR.titleHtml ?? esc(TOUR.title)}</h1>
        ${TOUR.problem ? `<p class="problem">${esc(TOUR.problem)}</p><span class="eyebrow how">How it works</span>` : ''}
        <p class="lead">${esc(TOUR.lead)}</p>
        <div class="chips">${(TOUR.chips ?? []).map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div>`
      const start = $('button', { className: 'btn', innerHTML: '▶&nbsp; Play the walkthrough' })
      start.onclick = () => go(1, true)
      inner.append(start)
    } else {
      inner.innerHTML = `<span class="eyebrow">Done</span><h1>${esc(TOUR.endTitle ?? 'Your turn')}</h1>
        <p class="lead">${esc(TOUR.outro ?? '')}</p>`
      const again = $('button', { className: 'btn ghost', innerHTML: '↺&nbsp; Watch again' })
      again.onclick = () => go(1, true)
      inner.append(again, $('span', { className: 'eyebrow', textContent: 'More walkthroughs' }), tourLinks())
    }
    cardSlot.replaceChildren(inner)
  }

  // ---------- the terminal ----------
  const lineEl = line => {
    if ('user' in line) return [$('div', { className: 'l-user' }), line.user, 'type']
    if ('cmd' in line) return [$('div', { className: 'l-cmd' }), line.cmd, 'type']
    if ('say' in line) return [$('div', { className: 'l-say' }), line.say, 'stream']
    if ('res' in line) return [$('div', { className: 'l-res' }), line.res, 'lines']
    if ('tool' in line) {
      const el = $('div', { className: 'l-tool', innerHTML: `<b>${esc(line.tool)}</b>${line.args ? `<span class="args">(${esc(line.args)})</span>` : ''}` })
      return [el, null, 'pop']
    }
    if ('ask' in line) {
      const el = $('div', { className: 'l-ask' })
      el.append($('div', { textContent: line.ask }))
      for (const o of line.options ?? []) el.append($('span', { className: `opt${o === line.pick ? ' picked' : ''}`, textContent: o }))
      return [el, null, 'pop']
    }
    const tone = line.tone ? ` l-${line.tone}` : ''
    return [$('div', { className: `l-out${tone}` }), line.out, 'lines']
  }
  const scrollEnd = () => { termBody.scrollTop = termBody.scrollHeight }

  /** Print lines at once (for steps we skip past). */
  const printNow = lines => {
    for (const line of lines) {
      const [el, text] = lineEl(line)
      if (text != null) el.textContent = text
      termBody.append(el)
    }
    scrollEnd()
  }
  /** Print lines as if typed and streamed; resolves early when `run` is cancelled. */
  const printAnimated = async (lines, run) => {
    for (const line of lines) {
      if (run.cancelled) return
      const [el, text, how] = lineEl(line)
      termBody.append(el)
      if (how === 'type') {
        const caret = $('span', { className: 'caret' })
        el.append(caret)
        await wait(250, run)
        for (let i = 0; i < text.length && !run.cancelled; i++) {
          caret.before(text[i])
          if (i % 2 === 0) scrollEnd()
          await wait(text.length > 90 ? 12 : 24, run)
        }
        caret.remove()
        if (run.cancelled) { el.textContent = text; return }
        await wait(380, run)
      } else if (how === 'lines') {
        const parts = text.split('\n')
        for (const [i, p] of parts.entries()) {
          if (run.cancelled) { el.textContent = text; return }
          el.append(i ? `\n${p}` : p)
          scrollEnd()
          await wait(45, run)
        }
        await wait(160, run)
      } else if (how === 'stream') {
        const words = text.split(/(\s+)/)
        for (const w of words) {
          if (run.cancelled) { el.textContent = text; return }
          el.append(w)
          await wait(w.trim() ? 28 : 0, run)
        }
        scrollEnd()
        await wait(200, run)
      } else {
        scrollEnd()
        await wait(how === 'pop' ? 520 : 200, run)
      }
      scrollEnd()
    }
  }

  // ---------- the browser ----------
  const imgs = new Map()
  const shotImg = src => {
    if (!imgs.has(src)) {
      const img = $('img', { src, alt: '', decoding: 'async' })
      pan.insertBefore(img, ring)
      imgs.set(src, img)
    }
    return imgs.get(src)
  }
  for (const s of steps) if (s.shot) shotImg(s.shot.src) // preload, in order
  let shownSrc = null
  const placeShot = (shot, run, animate) => {
    if (!shot) return
    if (shot.src !== shownSrc) {
      for (const [src, img] of imgs) img.classList.toggle('on', src === shot.src)
      shownSrc = shot.src
      shotImg(shot.src).alt = shot.alt ?? shot.caption ?? ''
    }
    url.innerHTML = `<span class="lock">🔒</span>${esc(shot.url ?? '')}`
    const p = shot.as ? TOUR.personas?.[shot.as] : null
    persona.dataset.who = shot.as ?? ''
    persona.innerHTML = p ? `<i>${esc(p.initials)}</i>${esc(p.label ?? p.name)}` : ''
    const [zx, zy, zs] = shot.zoom ?? [50, 50, 1]
    pan.style.transformOrigin = `${zx}% ${zy}%`
    pan.style.transform = `scale(${zs})`
    ring.classList.remove('on')
    if (shot.ring) {
      const [x, y, w, h] = shot.ring
      Object.assign(ring.style, { left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` })
    }
    if (shot.cursor) {
      cursor.classList.add('on')
      cursor.style.left = `${shot.cursor[0]}%`
      cursor.style.top = `${shot.cursor[1]}%`
    } else cursor.classList.remove('on')
    if (!animate) {
      if (shot.ring) ring.classList.add('on')
      return Promise.resolve()
    }
    return (async () => {
      await wait(shot.cursor ? 800 : 300, run)
      if (shot.click && !run.cancelled) {
        cursor.classList.remove('click')
        void cursor.offsetWidth
        cursor.classList.add('click')
      }
      if (shot.ring && !run.cancelled) ring.classList.add('on')
    })()
  }

  // ---------- playing ----------
  let at = -1
  let playing = false
  let run = { cancelled: true }
  const wait = (ms, r) => new Promise(res => {
    if (r.cancelled || ms <= 0) return res()
    const t = setTimeout(res, ms)
    r.timers.push(() => { clearTimeout(t); res() })
  })

  const holdFor = s => s.hold ?? Math.min(9000, 2200 + 38 * ((s.caption?.length ?? 0) + (s.note?.length ?? 0)))

  /** Draw the stage as it stands after step `i` has finished, without animation. */
  const settle = i => {
    termBody.replaceChildren()
    let kind = 'shell', title = ''
    let lastShot = null
    for (let j = 0; j <= i; j++) {
      const s = steps[j]
      if (s.term) {
        if (s.term.clear || (s.term.kind && s.term.kind !== kind && j > 0)) termBody.replaceChildren()
        kind = s.term.kind ?? kind
        title = s.term.title ?? title
        if (j < i) printNow(s.term.lines ?? [])
      }
      if (s.shot) lastShot = s.shot
    }
    term.dataset.kind = kind
    termTitle.textContent = title || ({ claude: 'claude', chat: 'Claude' })[kind] || 'zsh'
    return lastShot
  }

  const showCaption = s => {
    caption.classList.remove('enter')
    caption.innerHTML = `<span class="eyebrow">${esc(s.chapter)} · ${steps.indexOf(s)} of ${steps.length - 2}</span>
      <h2>${esc(s.caption)}</h2>${s.note ? `<p>${esc(s.note)}</p>` : ''}`
    if (s.card === 'intro') caption.innerHTML = ''
    void caption.offsetWidth
    caption.classList.add('enter')
  }

  const go = async (i, play) => {
    i = Math.max(0, Math.min(steps.length - 1, i))
    run.cancelled = true
    for (const t of run.timers ?? []) t()
    const r = (run = { cancelled: false, timers: [] })
    at = i
    setPlaying(play && i < steps.length - 1)
    const s = steps[i]
    history.replaceState(null, '', i ? `#step-${i}` : location.pathname + location.search)
    showCaption(s)
    stage.dataset.layout = s.layout ?? 'split'
    if (s.card) drawCard(s.card)
    const lastShot = settle(i)
    for (const [j, el] of segEls.entries()) {
      el.classList.toggle('done', j < i)
      el.style.setProperty('--p', j === i ? 0.0001 : 0)
      el.toggleAttribute('aria-current', j === i)
    }
    for (const c of chapterOf) c.el.toggleAttribute('aria-current', i >= c.first && i < c.first + c.n)
    count.textContent = i && i < steps.length - 1 ? `${i} / ${steps.length - 2}` : ''

    const animate = !reduced && playing
    const shotDone = placeShot(s.shot ?? lastShot, r, animate && !!s.shot)
    if (s.term) {
      if (animate) await printAnimated(s.term.lines ?? [], r)
      else printNow(s.term.lines ?? [])
    }
    await shotDone
    if (r.cancelled) return
    // the step's progress bar fills while it holds
    const seg = segEls[i]
    const hold = playing ? holdFor(s) : 0
    if (playing && !s.card) {
      seg.style.transition = 'none'
      seg.style.setProperty('--p', 0)
      seg.animate([{ '--p': 0 }, { '--p': 1 }], { duration: hold, fill: 'forwards' })
      const fill = seg.animate(
        [{ scale: '0 1' }, { scale: '1 1' }],
        { duration: hold, pseudoElement: '::after', fill: 'forwards', easing: 'linear' },
      )
      r.timers.push(() => fill.cancel())
    }
    await wait(hold, r)
    if (r.cancelled || !playing) return
    if (s.card === 'intro' && !playing) return
    if (i < steps.length - 1) go(i + 1, true)
  }

  const setPlaying = p => {
    playing = p
    playBtn.ariaLabel = p ? 'Pause' : 'Play'
    playBtn.innerHTML = p
      ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
  }
  playBtn.onclick = () => {
    if (playing) { setPlaying(false); run.cancelled = true; for (const t of run.timers) t(); go(at, false) }
    else go(at === steps.length - 1 || at === 0 ? 1 : at, true)
  }
  prevBtn.onclick = () => go(at - 1, false)
  nextBtn.onclick = () => go(at + 1, playing)
  addEventListener('keydown', e => {
    if (e.target.closest?.('input, textarea')) return
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); playBtn.click() }
    else if (e.key === 'ArrowRight' || e.key === 'l') go(at + 1, playing)
    else if (e.key === 'ArrowLeft' || e.key === 'j') go(at - 1, false)
  })
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) playBtn.click() })

  const fromHash = () => Number(/^#step-(\d+)$/.exec(location.hash)?.[1] ?? 0)
  addEventListener('hashchange', () => { const n = fromHash(); if (n !== at) go(n, false) })
  window.__tour = { go, steps, get at() { return at }, get playing() { return playing } } // for the checks
  go(fromHash(), false)
})()
