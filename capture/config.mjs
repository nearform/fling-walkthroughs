// What every capture script shares: the Fling and the personas the real accounts appear as.
// Which Fling to capture on: FLING=fling.labs.nearform.com node tours/<id>/capture.mjs …
// (it assumes the app and the sites share one domain, as both Flings here do).
export const RECORDED_ON = 'infinitesoftwarefactory.com' // where the committed shots and transcripts come from
export const SITES = process.env.FLING ?? RECORDED_ON
export const ORIGIN = `https://${SITES}`

/** How each real account appears on screen. */
export const PERSONAS = {
  you: { name: 'Sam Rivera', email: 'sam@example.com', initials: 'SR' },
  reviewer: { name: 'Ana Lopez', email: 'ana@example.com', initials: 'AL' },
}
