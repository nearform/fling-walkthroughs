// "Label an eval set": a page per sample, a blind labelling form, two people labelling, the labels
// back as data and merged into the dataset. Real output from doing it on infinitesoftwarefactory.com
// (transcripts/eval-*.txt); the summary's numbers are the real labels.
const SITE = 'support-evals'
const HOST = 'infinitesoftwarefactory.com'
const rv = id => `${HOST}/review/${SITE}?path=/s/${id}/`

window.TOUR = {
  id: 'eval-labelling',
  short: 'Label an eval set',
  title: 'Label an eval set',
  titleHtml: 'Model outputs need <span class="rainbow-text">human judges</span>.',
  eyebrow: 'Fling walkthrough · 4 of 5',
  problem: 'You have a JSONL of model outputs and need people to label them. Spreadsheets mangle long answers, a labelling tool takes days to set up, and labellers who can see each other’s answers stop judging independently.',
  lead: 'Ask Claude to get it labelled. It makes a page per sample, builds a blind labelling form with you, and merges every label back into the dataset.',
  chips: ['Claude Code', 'A page per sample', 'Forms', 'Blind labels', 'Save and next', 'Flag a passage', 'CSV / JSONL'],
  outro: 'Pages for people to read, a form for them to answer, and the answers back as data. No spreadsheet, no labelling tool to set up, nothing to host.',
  endTitle: 'Labels in, data out',
  personas: {
    you: { name: 'Sam Rivera', initials: 'SR', label: 'You (Sam), labelling' },
    reviewer: { name: 'Ana Lopez', initials: 'AL', label: 'Ana, labelling' },
  },
  get tours() { return window.FLING_TOURS },
  steps: [
    // ---------- the set ----------
    {
      chapter: 'The set',
      caption: 'Ask Claude to get 12 replies labelled',
      note: 'Each sample has the customer’s question, the model’s reply and the policy it should follow.',
      layout: 'term',
      term: {
        kind: 'claude',
        title: 'claude — ~/work/support-evals',
        lines: [
          { user: 'Ana and I need to label the replies in dataset.jsonl, without seeing each other’s labels, and I want the labels back as data' },
          { tool: 'Bash(head -c 400 dataset.jsonl; wc -l dataset.jsonl)' },
          { res: '{"id": "s01", "question": "Can I get a refund? I was charged for the annual plan yesterday but meant to pick monthly.", "reply": "Yes. Annual plans can be refunded in full within 14 days of purchase. I\'ve started the refund to your card; it takes 5\\u201310 working days. Then pick the monthly plan under Settings \\u2192 Billing.", "policy": "Annual plans: full refund within 14 days of purchase. Refu\n      12 dataset.jsonl' },
          { say: '12 samples, each a question, the model’s reply and the policy it should follow. I’ll make a page per sample for you to read, then put a labelling form beside them.' },
        ],
      },
    },
    {
      chapter: 'The set',
      caption: 'Claude turns it into a page per sample',
      note: 'A small script, so the pages can be rebuilt when the next model version’s replies come in.',
      term: {
        kind: 'claude',
        lines: [
          { tool: 'Write(build_pages.py)', args: 'turns dataset.jsonl into site/s/<id>/index.html and site/index.html' },
          { tool: 'Bash(python3 build_pages.py)' },
          { res: '12 pages' },
          { say: 'Built site/ with a page per sample at /s/s01/ … /s/s12/, and a home page listing all twelve.' },
        ],
      },
      shot: { src: 'shots/home.png', url: `${SITE}.${HOST}`, as: 'reviewer' },
    },

    // ---------- the form ----------
    {
      chapter: 'The form',
      caption: 'Claude asks what a label should say, and builds the form',
      note: 'The form lives in fling.forms.json beside the pages, and is never served. Blind: each labeller sees only their own answers.',
      layout: 'term',
      hold: 10000,
      term: {
        kind: 'claude',
        clear: true,
        title: 'claude — ~/work/support-evals',
        lines: [
          { say: 'What should each label collect?' },
          { user: 'pass, partial or fail; what went wrong (made something up, contradicts the policy, didn’t answer, wrong tone); notes. And a way to flag the exact words that are wrong, with a severity' },
          { tool: 'fling - fling_forms_template (MCP)', args: 'template: "labels", title: "Labels"' },
          { res: 'A starter "labels" config. Adapt its options, wording and `paths` to what the user wants collected, check it with fling_forms_check…' },
          { tool: 'Write(site/fling.forms.json)', args: 'a blind label on s/*/: verdict, what went wrong, notes; and a Flag a passage comment with a severity' },
          { tool: 'fling - fling_forms_check (MCP)', args: 'forms: …, paths: [13 files]' },
          { res: 'The forms config is valid.\n- Labels · Label this reply (label): one per reviewer per page, 12 pages, each reviewer sees only their own\n- Labels · Flag a passage (flag): a comment type, 12 pages' },
        ],
      },
    },
    {
      chapter: 'The form',
      caption: 'Published for the two people labelling',
      layout: 'term',
      term: {
        kind: 'claude',
        lines: [
          { tool: 'Bash(fling deploy site --name support-evals --access people --add ana@example.com)' },
          { res: '✔ Deployed support-evals (13 files, 25 KB; uploaded 13, version cf50a373814c3952)\n◆ Labels · Label this reply (label): one per reviewer per page, 12 pages, each reviewer sees only their own\n◆ Labels · Flag a passage (flag): a comment type, 12 pages\nWho can open it: Only you and 1 person can open it.' },
          { say: 'Send Ana the review link: https://infinitesoftwarefactory.com/review/support-evals. Labels is a tab beside each sample, and Save and next takes her through the ones she hasn’t done.' },
        ],
      },
    },

    // ---------- labelling ----------
    {
      chapter: 'Labelling',
      caption: 'Ana labels beside the sample',
      note: 'The review page has a Labels tab. Pick a verdict, say what went wrong, add a note.',
      layout: 'shot',
      shot: { src: 'shots/label-pass.png', url: rv('s01'), as: 'reviewer', ring: [76.4, 25.6, 22.6, 36], cursor: [78.2, 31.3], click: true, zoom: [96, 30, 1.35] },
    },
    {
      chapter: 'Labelling',
      caption: 'A fail, and why',
      note: 'The reply invents a reason for the decline. The policy says we only ever see the code.',
      layout: 'shot',
      shot: { src: 'shots/label-fail.png', url: rv('s03'), as: 'reviewer', cursor: [93.7, 82.2], click: true, ring: [76.4, 44, 22.6, 18], zoom: [96, 45, 1.35] },
    },
    {
      chapter: 'Labelling',
      caption: 'Save and next goes to the next page without an answer',
      note: 'The count goes up as she goes. She can stop and come back later; the form takes her to what’s left.',
      layout: 'shot',
      shot: { src: 'shots/label-next.png', url: rv('s04'), as: 'reviewer', ring: [76.4, 12.4, 22.6, 11.2], zoom: [96, 10, 1.35] },
    },
    {
      chapter: 'Labelling',
      caption: 'Flag the exact words that are wrong',
      note: 'Select a passage and choose Flag a passage: a comment with a severity, pinned to those words.',
      layout: 'shot',
      shot: { src: 'shots/flag.png', url: rv('s07'), as: 'reviewer', ring: [19.8, 36.6, 15.6, 4.4], cursor: [35.2, 38.8] },
    },
    {
      chapter: 'Labelling',
      caption: 'Posted, as a Blocker',
      layout: 'shot',
      shot: { src: 'shots/flag-posted.png', url: rv('s07'), as: 'reviewer', ring: [76.4, 8.6, 22.6, 46] },
    },
    {
      chapter: 'Labelling',
      caption: 'Sam labels the same set, without seeing Ana’s answers',
      note: 'The form is blind: each labeller sees only their own answers. Only the site’s owners see everyone’s.',
      layout: 'shot',
      shot: { src: 'shots/label-sam-done.png', url: rv('s12'), as: 'you', ring: [76.4, 11.6, 22.6, 9] },
    },
    {
      chapter: 'Labelling',
      caption: 'Progress: every page, every labeller',
      note: 'The site’s Labels page shows who has answered which sample, and downloads everything as CSV or JSONL.',
      layout: 'shot',
      shot: { src: 'shots/progress.png', url: `${HOST}/sites/${SITE}/responses`, as: 'you', ring: [22.3, 20.5, 70.6, 58.5], zoom: [55, 30, 1.2] },
    },

    // ---------- data ----------
    {
      chapter: 'The data',
      caption: 'Ask for the labels back',
      note: 'Claude reads the responses through Fling, and the same data downloads as CSV or JSONL.',
      layout: 'term',
      term: {
        kind: 'claude',
        clear: true,
        title: 'claude — ~/work/support-evals',
        lines: [
          { user: 'we’re done. get the labels, merge them into the dataset and tell me where the model fails' },
          { tool: 'fling - fling_responses_list (MCP)', args: 'name: "support-evals", form: "label"' },
          { res: 'Labels on support-evals: 20 responses.\n- Label this reply (label): 12 / 12 pages answered, 2 reviewers' },
          { tool: 'Bash(fling responses support-evals --format csv -o labels.csv)' },
          { res: '✔ Wrote 21 responses to labels.csv' },
        ],
      },
    },
    {
      chapter: 'The data',
      caption: 'Merged into the dataset, and where the model fails',
      layout: 'term',
      hold: 10000,
      term: {
        kind: 'claude',
        lines: [
          { tool: 'Bash(python3 merge_labels.py labels.csv)', args: 'writes dataset.labelled.jsonl' },
          { res: 'both labelled: 8, agree: 7; failing in someone’s view: s03, s05, s07, s12; problems: wrong_policy 3, made_up 2, missed 2, tone 1' },
          { say: 'Wrote dataset.labelled.jsonl, with each sample’s labels and flags. Ana and Sam agree on 7 of the 8 samples they both labelled; they differ on s05 (Ana: fail, Sam: partial), where the reply pitches pausing instead of saying how to cancel.' },
          { say: 'The failures: s03 makes up a reason for a card decline, s07 promises a 99.99% SLA on every plan (Ana flagged it as a blocker: Starter has no SLA), and s12 scolds an angry customer. s10 gets data residency only partly right. The biggest problem is contradicting the policy (3 labels), then making things up and missing the question (2 each).' },
        ],
      },
    },
  ],
}
