// "Just ask Claude": Fling as a connector in Claude (desktop, web or mobile), no terminal. Claude
// makes a page, publishes it for two people, reads the reviewer's comment, fixes it and resolves
// it. The tool results are the real ones from doing it on infinitesoftwarefactory.com; the consent
// page is Fling's own, opened as Claude's connector opens it.
const SITE = 'pricing-launch'
const HOST = 'infinitesoftwarefactory.com'
const REVIEW = `${HOST}/review/${SITE}`

window.TOUR = {
  id: 'claude-app',
  short: 'Just ask Claude',
  title: 'Just ask Claude',
  titleHtml: 'No terminal? <span class="rainbow-text">Do it from the chat.</span>',
  eyebrow: 'Fling walkthrough · 2 of 5',
  problem: 'Most people who work with Claude never open a terminal. What Claude makes for them stays in the chat: to share it they download a file, attach it somewhere and collect the replies by hand.',
  lead: 'Add your Fling to Claude as a connector, in Claude Desktop, on the web or on your phone. Claude publishes what it makes, you choose who sees it, and Claude acts on the comments.',
  chips: ['Claude Desktop', 'Claude on the web', 'Connector', 'Who can open it', 'Review', 'Comments'],
  outro: 'One address to add, one sign-in, and Claude can publish what it makes, choose who sees it and act on what reviewers say. The same in Claude Desktop, on the web and on your phone.',
  endTitle: 'Ask, and it’s online',
  personas: {
    you: { name: 'Sam Rivera', initials: 'SR', label: 'You (Sam)' },
    reviewer: { name: 'Ana Lopez', initials: 'AL', label: 'Ana, reviewing' },
  },
  get tours() { return window.FLING_TOURS },
  steps: [
    // ---------- connect ----------
    {
      chapter: 'Connect',
      caption: 'Your Fling has an address for Claude',
      note: 'Get started shows it. In Claude, open Settings → Connectors → Add custom connector, paste it and click Connect.',
      layout: 'shot',
      shot: { src: 'shots/get-started.png', url: `${HOST}/get-started`, as: 'you', ring: [32.9, 68.8, 48, 3.4], cursor: [80.2, 70.6], click: true },
    },
    {
      chapter: 'Connect',
      caption: 'Sign in, and allow Claude',
      note: 'Fling says what Claude will be able to do, as you. Connections in Fling lists it, to disconnect any time.',
      layout: 'shot',
      shot: { src: 'shots/consent.png', url: `${HOST}/oauth/authorize`, as: 'you', ring: [36.1, 61.4, 14, 5.6], cursor: [43.2, 64.2], click: true },
    },

    // ---------- make ----------
    {
      chapter: 'Make it',
      caption: 'Ask for a page, and who should see it',
      note: 'Claude writes the page in the conversation, checks the name is free and publishes it.',
      term: {
        kind: 'chat',
        lines: [
          { user: 'Make a one-page launch checklist for moving Starter customers to the new pricing on 1 February, and fling it as pricing-launch. Just me and ana@example.com.' },
          { say: 'Here’s the checklist: what has to be ready before launch, how we tell customers, and launch day, each with an owner.' },
          { tool: 'Fling · fling_check_name' },
          { res: '"pricing-launch" is available → https://pricing-launch.infinitesoftwarefactory.com/.' },
          { tool: 'Fling · fling_publish' },
          { res: 'Deployed 1 files (uploaded 1).\nSite: https://pricing-launch.infinitesoftwarefactory.com/ (people)\nWho can open it: Only you and 1 person can open it.' },
          { say: 'It’s live at https://pricing-launch.infinitesoftwarefactory.com/, and only you and Ana can open it. Send Ana the review link for her comments: https://infinitesoftwarefactory.com/review/pricing-launch' },
        ],
      },
      shot: { src: 'shots/live.png', url: `${SITE}.${HOST}`, as: 'you' },
    },

    // ---------- review ----------
    {
      chapter: 'Review',
      caption: 'Ana marks the words that are wrong',
      note: 'She selects a passage on the review page and says what should change.',
      layout: 'shot',
      shot: { src: 'shots/review-select.png', url: REVIEW, as: 'reviewer', ring: [27.9, 75.4, 17.1, 3.2], cursor: [44.6, 77] },
    },
    {
      chapter: 'Review',
      caption: 'One comment, pinned to that passage',
      layout: 'shot',
      shot: { src: 'shots/review-comment.png', url: REVIEW, as: 'reviewer', ring: [27.9, 75.4, 17.1, 3.2] },
    },

    // ---------- act ----------
    {
      chapter: 'Act on it',
      caption: 'Ask Claude to deal with it',
      note: 'Claude reads the comment, changes only the page it’s about, publishes on top of the live version, and resolves the thread.',
      term: {
        kind: 'chat',
        clear: true,
        lines: [
          { user: 'What did Ana say? Fix it and fling it again.' },
          { tool: 'Fling · fling_comments_list' },
          { res: '1 open thread on pricing-launch.\n  > 7 days before their next renewal\n  Our terms need 30 days’ notice of a price rise (section 4.2), so 7 days isn’t enough. Can we make it 30?' },
          { tool: 'Fling · fling_publish' },
          { res: 'Published 1 changed or added file on version 29f8719ed9865943 (the rest kept as it was).' },
          { tool: 'Fling · fling_comment_resolve' },
          { res: 'Thread 01k7i3cgrdpra2vrei on pricing-launch resolved' },
          { say: 'Ana’s right: our terms need 30 days’ notice. The email now goes 30 days before each renewal, starting 2 January, and her comment is resolved.' },
        ],
      },
      shot: { src: 'shots/fixed.png', url: `${SITE}.${HOST}`, as: 'you', ring: [23.1, 66, 53.8, 10.3] },
    },
    {
      chapter: 'Act on it',
      caption: 'Resolved, on the version that fixed it',
      note: 'Everyone sees what changed and why. Nobody opened a terminal.',
      layout: 'shot',
      shot: { src: 'shots/resolved.png', url: REVIEW, as: 'you', ring: [76.8, 33.2, 22.1, 7.9] },
    },
  ],
}
