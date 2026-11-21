// "A team site, a Path per ticket": one site for the payments team, a Path per ticket published
// by people, Claude or CI, reviewed and signed off one ticket at a time. Terminal lines are the real
// output of doing this on infinitesoftwarefactory.com (transcripts/team-site-*.txt).
const SITE = 'payments-plans'
const HOST = 'infinitesoftwarefactory.com'
const REVIEW = `${HOST}/review/${SITE}?path=/PAY-412/`

window.TOUR = {
  id: 'team-site',
  short: 'A team site',
  title: 'A team site, a Path per ticket',
  titleHtml: 'A team site, <span class="rainbow-text">a Path per ticket</span>',
  eyebrow: 'Fling walkthrough · 2 of 5',
  lead: 'Ask Claude for a site for the payments team: one address, a page per Jira or GitHub ticket, published by Claude or by CI, and each one reviewed and signed off on its own.',
  chips: ['Claude Code', 'Groups', 'Paths', 'The Paths block', 'Per-ticket review', 'Sign-off form', 'CI'],
  outro: 'Set access once for the team, then every ticket is a folder: its own versions, owners, review link and sign-off, on one site that lists them all.',
  endTitle: 'One site, every ticket',
  personas: {
    you: { name: 'Sam Rivera', initials: 'SR', label: 'You (Sam)' },
    reviewer: { name: 'Ana Lopez', initials: 'AL', label: 'Ana, reviewing' },
  },
  get tours() { return window.FLING_TOURS },
  steps: [
    // ---------- the team ----------
    {
      chapter: 'The team',
      caption: 'Ask Claude for a team site',
      note: 'Claude makes a group first: open the site to the group once, and whoever joins the team later can open it too.',
      layout: 'term',
      term: {
        kind: 'claude',
        title: 'claude — ~/work/payments-plans',
        lines: [
          { user: 'set up a site for the payments team’s plans: one page per Jira ticket, a home page listing them, a sign-off per plan, and only the team (me and ana@example.com) can open it' },
          { ask: 'Open it to a payments group rather than two people, so whoever joins the team can open it too?', options: ['Yes, a group', 'Just the two of us'], pick: 'Yes, a group' },
          { tool: 'Bash(fling groups create payments --name "Payments team")' },
          { res: '✔ Group payments created\npayments (Payments team, 0 people), owned by you (you can change it).' },
          { tool: 'Bash(fling groups add payments ana@example.com)' },
          { res: 'payments (Payments team, 1 person), owned by you (you can change it).\nMembers: ana@example.com.' },
        ],
      },
    },
    {
      chapter: 'The team',
      caption: 'A home page that lists every ticket, and a sign-off form',
      note: 'The home page has a Paths block: Fling fills it with the live tickets, newest first. The form applies to every ticket’s page.',
      layout: 'term',
      hold: 9000,
      term: {
        kind: 'claude',
        lines: [
          { tool: 'fling - fling_paths_template (MCP)', args: 'template: "plans", title: "Payments plans"' },
          { res: 'A starter "plans" home page with its Paths block in place.' },
          { tool: 'Write(home/index.html)', args: 'the plans board, one card per ticket' },
          { tool: 'Write(home/fling.forms.json)', args: 'Sign-off on PAY-*/: ready to build or needs changes, and a note' },
          { tool: 'Bash(fling paths check home)' },
          { res: '✔ home/index.html has a template Paths block (sort=updated)' },
          { tool: 'Bash(fling deploy home --name payments-plans --access groups --group payments)' },
          { res: '✔ Deployed payments-plans (1 files, 2.3 KB; uploaded 1, version 49deef6efcf6e64a)\n◆ Sign-off · Sign-off (signoff): one per reviewer per page\nWho can open it: Only you and 1 group can open it.' },
          { say: 'payments-plans is up for the payments group. Publish each plan as a Path named after its ticket, such as PAY-412, and it appears on the home page.' },
        ],
      },
    },

    // ---------- tickets ----------
    {
      chapter: 'Tickets',
      caption: 'Each ticket is a Path: a folder published on its own',
      note: 'A Path has its own versions, rollback and owners. Teammates publish different tickets at the same time without getting in each other’s way.',
      layout: 'term',
      term: {
        kind: 'claude',
        clear: true,
        title: 'claude — ~/work/payments-plans',
        lines: [
          { user: 'publish the PAY-431 and PAY-418 plans' },
          { tool: 'Bash(fling deploy PAY-431 --name payments-plans --path PAY-431)' },
          { res: '✔ Deployed payments-plans to /PAY-431/ (1 files, 2.8 KB; uploaded 1, version 71bd8ece1138ffab)' },
          { tool: 'Bash(fling deploy PAY-418 --name payments-plans --path PAY-418)' },
          { res: '✔ Deployed payments-plans to /PAY-418/ (1 files, 2.8 KB; uploaded 1, version bb7e7b3ab0f9ec4b)' },
          { say: 'Both are live: https://payments-plans.infinitesoftwarefactory.com/PAY-431/ and /PAY-418/.' },
        ],
      },
    },
    {
      chapter: 'Tickets',
      caption: 'Or ask Claude to publish the plan it just wrote',
      note: 'Access comes from the site, so there is nothing to choose: the payments group can open it at once.',
      term: {
        kind: 'claude',
        clear: true,
        title: 'claude — ~/work/payments-plans',
        lines: [
          { user: 'publish this plan to payments-plans as PAY-412' },
          { tool: 'fling - fling_deploy (MCP)', args: 'path: "PAY-412", name: "payments-plans", sitePath: "PAY-412"' },
          { res: 'Deployed 1 files to the Path /PAY-412/ (the rest of the site untouched) (uploaded 1).\nSite: https://payments-plans.infinitesoftwarefactory.com/PAY-412/ (groups)' },
          { say: 'PAY-412 is live at https://payments-plans.infinitesoftwarefactory.com/PAY-412/. The payments group can open it. For a review of just this ticket, share https://infinitesoftwarefactory.com/review/payments-plans?path=/PAY-412/' },
        ],
      },
      shot: { src: 'shots/ticket.png', url: `${SITE}.${HOST}/PAY-412/`, as: 'you' },
    },
    {
      chapter: 'Tickets',
      caption: '…or have CI publish it from the pull request',
      note: 'CI uses a key in FLING_API_KEY instead of signing in. Name the branch after the ticket and the Path follows it.',
      layout: 'term',
      term: {
        kind: 'claude',
        clear: true,
        title: 'claude — ~/work/payments-plans',
        lines: [
          { user: 'when someone opens a PR with a plan in it, publish it as that ticket' },
          { tool: 'Write(.github/workflows/plan.yml)' },
          { res: "on:\n  pull_request:\n    paths: ['plan/**']\njobs:\n  fling:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with: { node-version: 22 }\n      - run: npx @nearform/fling deploy ./plan --name payments-plans --path \"${{ github.head_ref }}\"\n        env:\n          FLING_URL: https://infinitesoftwarefactory.com\n          FLING_API_KEY: ${{ secrets.FLING_API_KEY }}" },
          { say: 'A PR from a branch named PAY-440 publishes plan/ to /PAY-440/. Add a Fling API key to the repository as the secret FLING_API_KEY.' },
        ],
      },
    },
    {
      chapter: 'Tickets',
      caption: 'One address, every ticket, newest first',
      note: 'The home page’s list is filled in by Fling whenever a ticket is published, archived or deleted. Nobody edits it by hand.',
      layout: 'shot',
      shot: { src: 'shots/home.png', url: `${SITE}.${HOST}`, as: 'you', ring: [20, 26.6, 19.3, 15.2], cursor: [28, 33], click: true, zoom: [40, 20, 1.5] },
    },

    // ---------- review ----------
    {
      chapter: 'Review',
      caption: 'A review link for one ticket',
      note: 'Add ?path=/PAY-412/ to the review link and Ana lands on that ticket, with only its comments.',
      layout: 'shot',
      shot: { src: 'shots/review-pin.png', url: REVIEW, as: 'reviewer', cursor: [27.5, 72.2], click: true, ring: [76.4, 20.6, 22.2, 10] },
    },
    {
      chapter: 'Review',
      caption: 'And a sign-off, ticket by ticket',
      note: 'The site’s Sign-off form applies to every ticket’s page (paths: PAY-*/). Ana answers once per ticket and can change her mind.',
      layout: 'shot',
      shot: { src: 'shots/signoff.png', url: REVIEW, as: 'reviewer', ring: [76.2, 13.4, 22.4, 34], cursor: [78, 22.4], click: true },
    },
    {
      chapter: 'Review',
      caption: 'Saved',
      note: 'She approves PAY-431 the same way. Comments and answers stay with the version they were made on.',
      layout: 'shot',
      shot: { src: 'shots/signoff-saved.png', url: REVIEW, as: 'reviewer', ring: [83, 92.6, 15.3, 5.2] },
    },

    // ---------- back ----------
    {
      chapter: 'Decisions',
      caption: 'Ask Claude where the sign-offs stand',
      note: 'One answer per ticket and reviewer, as data: Claude reads it, and the site’s responses page downloads it as CSV or JSONL.',
      layout: 'term',
      term: {
        kind: 'claude',
        clear: true,
        title: 'claude — ~/work/payments-plans',
        lines: [
          { user: 'where are we on sign-offs?' },
          { tool: 'Bash(fling responses payments-plans)' },
          { res: 'PAGE       FORM     REVIEWER         UPDATED           ANSWERS\n/PAY-412/  signoff  ana@example.com  2026-11-16 10:43  Is this plan ready to build?: Needs changes · Anything to add?: Good plan. Just…\n/PAY-431/  signoff  ana@example.com  2026-11-16 10:44  Is this plan ready to build?: Approve' },
          { say: 'PAY-431 is approved. PAY-412 needs changes: Ana asks what we do if Week 3 misses the 25% bar. PAY-418 has no sign-off yet. Shall I add a fallback for Week 3 to the PAY-412 plan and publish it again?' },
        ],
      },
    },
    {
      chapter: 'Decisions',
      caption: 'Each ticket keeps its own versions and owners',
      note: 'Roll one ticket back, or give it its own owners, without touching the others.',
      layout: 'term',
      term: {
        kind: 'claude',
        lines: [
          { user: 'list the tickets, and PAY-412’s versions' },
          { tool: 'Bash(fling paths payments-plans)' },
          { res: 'PATH       TITLE                                   VERSION           STATE  PUBLISH  UPDATED\n/PAY-412/  Retry failed card payments              c3cdb4159c9f023b  live   yes      2026-11-16 10:43\n/PAY-418/  Show VAT on invoices for EU customers   bb7e7b3ab0f9ec4b  live   yes      2026-11-16 10:42\n/PAY-431/  Refunds to the original payment method  71bd8ece1138ffab  live   yes      2026-11-16 10:42' },
          { tool: 'Bash(fling versions payments-plans --path PAY-412)' },
          { res: '   VERSION           FILES  SIZE    BY               CREATED\n*  c3cdb4159c9f023b  1      3.0 KB  sam@example.com  2026-11-16 10:43' },
          { say: 'Three tickets, all live. PAY-412 has one version so far, so a rollback would have nothing to go back to.' },
        ],
      },
    },
    {
      chapter: 'Decisions',
      caption: 'The same list in the web app',
      note: 'The site’s Versions tab lists its Paths, each with its own Review and View.',
      layout: 'shot',
      shot: { src: 'shots/paths.png', url: `${HOST}/sites/${SITE}`, as: 'you', ring: [23, 62.8, 70.5, 33], zoom: [77, 100, 1.35] },
    },
  ],
}
