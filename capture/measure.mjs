// Where elements sit in a 1440×900 shot, as the player's percentages: ring [x, y, w, h] and a
// cursor at the centre. Use it on the page right before (or right after) snapping it.
export async function measure(page, locators, pad = 0.6) {
  const out = {}
  for (const [name, loc] of Object.entries(locators)) {
    const b = await loc.first().boundingBox()
    if (!b) { out[name] = null; continue }
    const px = v => +(v / 1440 * 100).toFixed(1), py = v => +(v / 900 * 100).toFixed(1)
    out[name] = {
      ring: [+(px(b.x) - pad).toFixed(1), +(py(b.y) - pad).toFixed(1), +(px(b.width) + 2 * pad).toFixed(1), +(py(b.height) + 2 * pad).toFixed(1)],
      cursor: [px(b.x + b.width / 2), py(b.y + b.height / 2)],
    }
  }
  return out
}
