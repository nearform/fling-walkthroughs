// "Your first fling": set up, publish a report from Claude Code, open it to one person, get it
// reviewed, act on the review. Terminal lines are the real output of doing this on
// infinitesoftwarefactory.com (transcripts/), with the accounts shown as Sam and Ana.
const SITE = 'q3-support-report'
const HOST = 'infinitesoftwarefactory.com'
const APP = `https://${HOST}`

window.TOUR = {
  id: 'get-started',
  short: 'Your first fling',
  title: 'Your first fling',
  titleHtml: 'Your first <span class="rainbow-text">fling</span>',
  eyebrow: 'Fling walkthrough · 1 of 5',
  lead: 'Install the CLI, let Claude Code publish a report, choose who can open it, and get a colleague’s review back as comments Claude can act on.',
  chips: ['fling setup', 'Claude Code', 'Who can open it', 'Review page', 'Comments'],
  outro: 'One command to set up, and from then on you just ask: “fling this”. The review link is the one to share; comments come back to you and to Claude.',
  endTitle: 'Throw it. Get a link.',
  personas: {
    you: { name: 'Sam Rivera', initials: 'SR', label: 'You (Sam)' },
    reviewer: { name: 'Ana Lopez', initials: 'AL', label: 'Ana, reviewing' },
  },
  get tours() { return window.FLING_TOURS },
  steps: [
    // ---------- set up ----------
    {
      chapter: 'Set up',
      caption: 'Your Fling tells you how to start',
      note: 'The Get started page of the web app has the two commands: install the CLI once, then point it at your Fling.',
      term: { kind: 'shell', title: 'zsh — ~', lines: [] },
      shot: { src: 'shots/get-started.png', url: `${HOST}/get-started`, as: 'you', ring: [32.5, 33, 50.5, 4.3], cursor: [80, 35.5] },
    },
    {
      chapter: 'Set up',
      caption: 'Install the fling command',
      term: {
        kind: 'shell',
        lines: [
          { cmd: 'npm install -g @nearform/fling' },
          { out: 'added 121 packages in 3s\n50 packages are looking for funding\n  run `npm fund` for details' },
        ],
      },
      shot: { src: 'shots/get-started.png', url: `${HOST}/get-started`, as: 'you', ring: [32.5, 58.4, 50.5, 4.3], cursor: [80, 60.5] },
    },
    {
      chapter: 'Set up',
      caption: 'fling setup signs you in and adds Fling to Claude Code',
      note: 'Your browser opens to sign in with your usual account. The CLI keeps a key for this computer, then offers to install the Claude Code plugin.',
      layout: 'term',
      hold: 7000,
      term: {
        kind: 'shell',
        lines: [
          { cmd: `fling setup ${APP}` },
          { out: '┌   fling setup\n│  ◆ Opening your browser to sign in to Fling at https://infinitesoftwarefactory.com\n│  ◆ Waiting for the browser to complete sign-in (5-minute timeout)…' },
          { out: '│  ✔ Signed in as sam@example.com\n│    Server: https://infinitesoftwarefactory.com\n│    API key: fling_••••… (stored in ~/.fling/config.json)\n│', tone: 'ok' },
          { out: '◇  Install the Fling plugin (skill + MCP server) into Claude Code?\n│  Yes\n│\n◇  Claude Code plugin fling installed (user scope)\n│    Restart Claude Code (or run /reload-plugins) to pick it up.\n│\n◇  Add the Fling extension to Claude Desktop too?\n│  No\n│' },
          { out: '└  You’re set. Try fling deploy ./dist, or ask Claude to “fling this”.\nHow everything works: https://infinitesoftwarefactory.com/guide', tone: 'ok' },
        ],
      },
    },

    // ---------- publish ----------
    {
      chapter: 'Publish',
      caption: 'In Claude Code, just ask',
      note: 'Sam has a one-page report in a folder. Claude knows how to fling it: it checks the name is free and asks who should be able to open it.',
      term: {
        kind: 'claude',
        clear: true,
        title: 'claude — ~/work/q3-support-report',
        lines: [
          { user: 'fling this report as q3-support-report' },
          { tool: 'fling - fling_check_name (MCP)', args: 'name: "q3-support-report", server: "infinitesoftwarefactory.com"' },
          { res: '"q3-support-report" is available → https://q3-support-report.infinitesoftwarefactory.com/' },
          { ask: 'Who should be able to open it?', options: ['Only me, for now', 'Everyone signed in to Fling', 'Specific people or groups', 'Public'], pick: 'Only me, for now' },
        ],
      },
      shot: { src: 'shots/sites-list.png', url: HOST, as: 'you' },
      layout: 'term',
    },
    {
      chapter: 'Publish',
      caption: 'Live in a second, with a review link first',
      note: 'The result leads with the review link: the one to send when you want feedback. The site itself is open only to Sam.',
      term: {
        kind: 'claude',
        lines: [
          { tool: 'fling - fling_deploy (MCP)', args: 'path: ".", name: "q3-support-report", access: "only_me"' },
          { res: 'Deployed 1 files (uploaded 1).\nShare for feedback: https://infinitesoftwarefactory.com/review/q3-support-report\nSite: https://q3-support-report.infinitesoftwarefactory.com/ (only_me)' },
          { say: 'It’s live. Share the review link for feedback: https://infinitesoftwarefactory.com/review/q3-support-report. The site is https://q3-support-report.infinitesoftwarefactory.com/, and only you can open it for now.' },
        ],
      },
      shot: { src: 'shots/site-live.png', url: `${SITE}.${HOST}`, as: 'you' },
    },
    {
      chapter: 'Publish',
      caption: 'It’s on your Sites page too',
      note: 'Every site has a Review and a View button, and says who can open it.',
      shot: { src: 'shots/sites-list.png', url: HOST, as: 'you', ring: [18.6, 22.6, 79.4, 7.4], cursor: [68, 26.4] },
    },

    // ---------- share ----------
    {
      chapter: 'Share',
      caption: 'Open it to one more person',
      note: 'Access is a setting, not a new publish. Ana can now open the site and its review page; nobody else can.',
      term: {
        kind: 'claude',
        lines: [
          { user: 'let ana@example.com open it, and send her the review link' },
          { tool: 'fling - fling_set_access (MCP)', args: 'name: "q3-support-report", access: "people", emails: ["ana@example.com"]' },
          { res: 'q3-support-report: Restricted: only you and 1 person can open it: ana@example.com.' },
          { say: 'Done: you and ana@example.com can open it. Fling emails Ana to say it’s shared with her. Her review link: https://infinitesoftwarefactory.com/review/q3-support-report' },
        ],
      },
      shot: { src: 'shots/site-access.png', url: `${HOST}/sites/${SITE}`, as: 'you', ring: [26.4, 92.6, 12.1, 3], cursor: [36, 94] },
    },

    // ---------- review ----------
    {
      chapter: 'Review',
      caption: 'Ana opens the review page',
      note: 'The site in a frame, comments beside it. Ana signs in with her own account; what she writes is signed with her name.',
      layout: 'shot',
      shot: { src: 'shots/review-open.png', url: `${HOST}/review/${SITE}`, as: 'reviewer' },
    },
    {
      chapter: 'Review',
      caption: 'She pins a comment to the exact spot',
      note: 'Alt-click a spot (or press Pin to a spot) and say what should change. The pin stays on that label.',
      layout: 'shot',
      shot: { src: 'shots/review-pin.png', url: `${HOST}/review/${SITE}`, as: 'reviewer', cursor: [32, 70.6], click: true },
    },
    {
      chapter: 'Review',
      caption: '…or marks a passage',
      note: 'Drag across text to comment on just that sentence.',
      layout: 'shot',
      shot: { src: 'shots/review-select.png', url: `${HOST}/review/${SITE}`, as: 'reviewer', cursor: [42.5, 24.2], ring: [15.9, 22, 27.3, 4.4] },
    },
    {
      chapter: 'Review',
      caption: 'Two threads, waiting for Sam',
      note: 'Sam hears about new threads by email. Each comment remembers the version it was written on.',
      layout: 'shot',
      shot: { src: 'shots/review-comments.png', url: `${HOST}/review/${SITE}`, as: 'reviewer', ring: [76.4, 7.3, 22.8, 61] },
    },

    // ---------- act ----------
    {
      chapter: 'Act on it',
      caption: 'Claude reads the comments…',
      term: {
        kind: 'claude',
        lines: [
          { user: 'what feedback is there on q3-support-report? fix it, republish, and resolve the threads' },
          { tool: 'fling - fling_comments_list (MCP)', args: 'name: "q3-support-report"' },
          { res: '2 open threads on q3-support-report.\n- [01k7htciu52tmkht5d] / — ana@example.com:\n  This label should be Sep: the chart runs July to September.\n- [01k7htcmt3moqsp4tq] / — ana@example.com:\n  How many is "most"? Give the number, so people don’t have to work it out from the table.' },
        ],
      },
      shot: { src: 'shots/review-comments.png', url: `${HOST}/review/${SITE}`, as: 'reviewer' },
    },
    {
      chapter: 'Act on it',
      caption: '…fixes the page, publishes again, and resolves both threads',
      note: 'Publishing again sends only what changed and keeps who can open it.',
      term: {
        kind: 'claude',
        lines: [
          { tool: 'Update(index.html)', args: 'the third month label Aug → Sep; the lead now says 4,610 of 12,480 tickets (37%)' },
          { tool: 'fling - fling_deploy (MCP)', args: 'path: ".", name: "q3-support-report"' },
          { res: 'Deployed 1 files (uploaded 1).\nSite: https://q3-support-report.infinitesoftwarefactory.com/ (people)' },
          { tool: 'fling - fling_comment_resolve (MCP)', args: 'name: "q3-support-report", id: "01k7htciu52tmkht5d"' },
          { res: 'Thread 01k7htciu52tmkht5d on q3-support-report resolved' },
          { tool: 'fling - fling_comment_resolve (MCP)', args: 'name: "q3-support-report", id: "01k7htcmt3moqsp4tq"' },
          { res: 'Thread 01k7htcmt3moqsp4tq on q3-support-report resolved' },
          { say: 'Both fixed and live: the chart now ends in Sep, and the lead gives billing as 4,610 of 12,480 tickets (37%). I resolved Ana’s two threads.' },
        ],
      },
      shot: { src: 'shots/site-fixed.png', url: `${SITE}.${HOST}`, as: 'you' },
    },
    {
      chapter: 'Act on it',
      caption: 'Resolved, on the version that fixed them',
      note: 'Tick Resolved to see closed threads. The pins sit on the corrected page.',
      layout: 'shot',
      shot: { src: 'shots/review-resolved.png', url: `${HOST}/review/${SITE}`, as: 'you', ring: [28.6, 71.4, 5, 5.4], cursor: [31, 75.5] },
    },
  ],
}
