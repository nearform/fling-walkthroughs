// "A site that does real work": a triage desk whose server keeps an Anthropic key, asks Claude to
// triage a ticket and signs the reply as the person calling. Real output from building and
// publishing it on infinitesoftwarefactory.com (transcripts/server-*.txt). The key is never shown.
const SITE = 'triage-desk'
const HOST = 'infinitesoftwarefactory.com'

window.TOUR = {
  id: 'site-server',
  short: 'A site that does real work',
  title: 'A site that does real work',
  titleHtml: 'A site that does <span class="rainbow-text">real work</span>',
  eyebrow: 'Fling walkthrough · 4 of 5',
  lead: 'Ask Claude for a support triage desk: paste a ticket, and a small server beside the page asks Claude for a category, a priority and a draft reply. The API key never leaves the server.',
  chips: ['Claude Code', 'server.ts', 'fling dev', 'Site secrets', 'Who is calling', 'Health check', 'Logs'],
  outro: 'A page and a server.ts, published together, versioned together, rolled back together. The key is a site secret; the server knows who is calling; nothing goes live until it answers.',
  endTitle: 'Pages that do things',
  personas: {
    you: { name: 'Sam Rivera', initials: 'SR', label: 'You (Sam)' },
  },
  get tours() { return window.FLING_TOURS },
  steps: [
    // ---------- build ----------
    {
      chapter: 'Build',
      caption: 'Ask for the page and the server together',
      note: 'The page can’t hold an API key. A server.ts next to index.html can: Fling runs it for every request to /api/ on the site’s own address.',
      layout: 'term',
      term: {
        kind: 'claude',
        title: 'claude — ~/work/triage-desk',
        lines: [
          { user: 'make a triage desk: paste a support ticket and Claude gives a category, priority, team and a draft reply signed by whoever is using it. keep the Anthropic key on a server' },
          { tool: 'Write(index.html)', args: 'the ticket box, three sample tickets, the result card' },
          { tool: 'Write(server.ts)', args: 'POST /api/triage calls the Claude API with the site secret; GET /api/health; GET /api/me' },
          { tool: 'Write(fling.json)', args: 'secrets: ANTHROPIC_API_KEY, health: /api/health' },
          { tool: 'Bash(npm install --save-dev @nearform/fling)' },
          { say: 'The page posts the ticket to /api/triage. The server reads ANTHROPIC_API_KEY as a site secret, asks Claude for the triage, and signs the draft with the signed-in viewer’s name. Put the key in .env (it’s never published) and I’ll run it.' },
        ],
      },
    },
    {
      chapter: 'Build',
      caption: 'The server knows who is calling',
      note: 'viewer() comes from Fling’s sign-in, never from the browser. secret() reads the key, and names it when it isn’t set.',
      layout: 'term',
      hold: 9000,
      term: {
        kind: 'claude',
        clear: true,
        title: 'claude — ~/work/triage-desk',
        lines: [
          { user: 'how does it know who is calling?' },
          { tool: 'Read(server.ts)', args: 'lines 57–71' },
          { res: "    if (pathname === '/api/health') {\n      secret('ANTHROPIC_API_KEY') // throws, naming it, when it isn't set\n      return json({ ok: true })\n    }\n    if (pathname === '/api/me') return json({ email: who?.email ?? null })\n    if (pathname === '/api/triage' && request.method === 'POST') {\n      if (!who) return json({ error: 'Sign in to triage tickets.' }, 401)\n      const { ticket } = (await request.json().catch(() => ({}))) as { ticket?: string }\n      if (!ticket?.trim()) return json({ error: 'Paste a ticket first.' }, 400)\n      const started = Date.now()\n      const t = await triage(ticket.slice(0, MAX_TICKET))\n      const name = who.email.split('@')[0].replace(/^./, c => c.toUpperCase())\n      // logs carry the viewer id, never the address: everyone who publishes the site reads them\n      console.log(`triaged for ${who.id}: ${t.priority} ${t.category} in ${Date.now() - started} ms`)\n      return json({ ...t, draftReply: `${t.draftReply}\\n\\n${name}, Customer Support` })" },
          { say: 'viewer(request) is the signed-in person, from Fling’s sign-in: the page can’t fake it. Their name goes on the draft; the log gets their viewer id, not their address.' },
        ],
      },
    },

    // ---------- try ----------
    {
      chapter: 'Try it',
      caption: 'Claude runs it the way it will be served',
      note: 'fling dev serves the pages, sends /api/ to the server and rebuilds on save. --as signs requests in as someone; secrets come from .env.',
      term: {
        kind: 'claude',
        clear: true,
        title: 'claude — ~/work/triage-desk',
        lines: [
          { user: 'the key’s in .env. run it' },
          { tool: 'Bash(fling dev --as sam@example.com)', args: 'in the background' },
          { res: '◆ serving triage-desk/ at http://localhost:47180  (server: server.ts, rebuilt on save)\n  viewer: sam@example.com (v_sxrjqfrbfo4e4) · secrets: ANTHROPIC_API_KEY (from .env)' },
          { say: 'It’s at http://localhost:47180, signed in as sam@example.com, with the key from .env. Try one of the sample tickets.' },
        ],
      },
      shot: { src: 'shots/local-result-ticket.png', url: 'localhost:47180', as: 'you', cursor: [18, 58.2], click: true },
    },
    {
      chapter: 'Try it',
      caption: 'A real triage, on your computer',
      note: 'Every request, and everything the server prints, is in fling dev’s output.',
      term: {
        kind: 'claude',
        lines: [
          { user: 'works. what did the server do?' },
          { tool: 'BashOutput(fling dev)' },
          { res: '11:00:33  GET /api/me  200  4 ms  v_sxrjqfrbfo4e4  version dev-1\n11:00:37  triaged for v_sxrjqfrbfo4e4: P1 Bug in 1637 ms\n11:00:37  POST /api/triage  200  1639 ms  v_sxrjqfrbfo4e4  version dev-1' },
          { say: 'One triage: Claude answered in 1.6 s with P1, Bug. The log line carries your viewer id, not your address.' },
        ],
      },
      shot: { src: 'shots/local-result.png', url: 'localhost:47180', as: 'you', ring: [50, 14, 37.5, 48.3] },
    },

    // ---------- publish ----------
    {
      chapter: 'Publish',
      caption: 'Publishing holds the server until its secret is set',
      note: '.env is a dotfile, so it is never published. The version uploads and waits: it goes live once the key is set, with nothing to publish again.',
      layout: 'term',
      term: {
        kind: 'claude',
        clear: true,
        title: 'claude — ~/work/triage-desk',
        lines: [
          { user: 'ship it, for everyone signed in' },
          { tool: 'Bash(fling deploy . --name triage-desk --access members)' },
          { res: '◆ bundling server.ts → _fling/server.mjs (2.1 KB, 1.2 KB gzipped)\n◆ Skipped 2 dotfiles (.env, .gitignore) — dotfiles are never flung\n✖ Version 7b2237d9ce832fcf of "triage-desk" needs the site secrets ANTHROPIC_API_KEY, which aren\'t set. It goes live as soon as they are' },
          { ask: 'It’s waiting for ANTHROPIC_API_KEY. Set it from your .env? Fling reads that one key from the file; I never see it.', options: ['Yes, from .env', 'I’ll set it myself'], pick: 'Yes, from .env' },
        ],
      },
    },
    {
      chapter: 'Publish',
      caption: 'The key is set, and it’s live',
      note: 'Secrets never go on the command line. Fling starts the server, asks /api/health, and only then swaps the new version in.',
      layout: 'term',
      term: {
        kind: 'claude',
        lines: [
          { tool: 'Bash(fling secrets set triage-desk --from .env ANTHROPIC_API_KEY)' },
          { res: '✔ ANTHROPIC_API_KEY set on triage-desk (from .env; nothing else read)\n◆ Version 7b2237d9ce832fcf is live now: https://triage-desk.infinitesoftwarefactory.com/' },
          { say: 'Live at https://triage-desk.infinitesoftwarefactory.com/ for everyone signed in to this Fling. Nothing needed publishing again.' },
        ],
      },
    },

    // ---------- live ----------
    {
      chapter: 'Live',
      caption: 'Anyone signed in can use it',
      note: 'Same sign-in as the pages. The server sees who is calling and signs the draft with their name.',
      layout: 'shot',
      shot: { src: 'shots/live-result-ticket.png', url: `${SITE}.${HOST}`, as: 'you', cursor: [18, 58.2], click: true },
    },
    {
      chapter: 'Live',
      caption: 'P1, Billing, Payments, and a reply ready to send',
      layout: 'shot',
      shot: { src: 'shots/live-result.png', url: `${SITE}.${HOST}`, as: 'you', ring: [50, 14, 37.5, 45.6], zoom: [69, 30, 1.25] },
    },
    {
      chapter: 'Live',
      caption: 'Ask Claude how it’s being used',
      note: 'fling logs: a line per request and what the server printed, kept 7 days.',
      layout: 'term',
      term: {
        kind: 'claude',
        clear: true,
        title: 'claude — ~/work/triage-desk',
        lines: [
          { user: 'is anyone using it?' },
          { tool: 'Bash(fling logs triage-desk --since 15m)' },
          { res: '11:01:20  GET /api/me  200  114 ms  v_aefszfnsl6tsi  version 7b2237d9ce832fcf\n11:01:24  triaged for v_aefszfnsl6tsi: P1 Billing in 1815 ms\n11:01:24  POST /api/triage  200  1825 ms  v_aefszfnsl6tsi  version 7b2237d9ce832fcf\n11:01:50  GET /api/me  200  103 ms  v_aefszfnsl6tsi  version 7b2237d9ce832fcf\n11:01:54  POST /api/triage  200  1613 ms  v_aefszfnsl6tsi  version 7b2237d9ce832fcf\n11:01:54  triaged for v_aefszfnsl6tsi: P1 Billing in 1560 ms' },
          { say: 'Two triages in the last 15 minutes, both by one person and both P1 Billing, at 1.6 to 1.8 s each. No errors.' },
        ],
      },
    },
    {
      chapter: 'Live',
      caption: 'The Server tab: where it answers, what it may reach, its limits',
      note: 'Rolling the site back rolls the server back too.',
      layout: 'shot',
      shot: { src: 'shots/server-tab.png', url: `${HOST}/sites/${SITE}`, as: 'you', ring: [22.3, 10.3, 71, 36.5] },
    },
  ],
}
