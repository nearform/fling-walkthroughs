// Finds where a piece of text appears in screenshots, with macOS Vision, so the player can paint
// over it (see capture/text-patches.mjs). Prints one JSON object per match:
//   swift capture/find-text.swift <needle> <png>…
// box is [x, y, w, h] in pixels from the top left, from the needle's first character to the end
// of its line; bg is the colour just left of it, fg the colour of the text.
import AppKit
import Vision

let args = CommandLine.arguments
let needle = args[1].lowercased()

func pixel(_ rep: NSBitmapImageRep, _ x: Int, _ y: Int) -> [Int] {
  var px = [Int](repeating: 0, count: 4); rep.getPixel(&px, atX: max(0, min(rep.pixelsWide - 1, x)), y: max(0, min(rep.pixelsHigh - 1, y)))
  return Array(px.prefix(3)) // raw values, as the browser draws the PNG
}
func hex(_ c: [Int]) -> String { "#" + c.map { String(format: "%02x", $0) }.joined() }
func dist(_ a: [Int], _ b: [Int]) -> Int { zip(a, b).map { abs($0 - $1) }.reduce(0, +) }

for path in args.dropFirst(2) {
  guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
  let rep = NSBitmapImageRep(cgImage: cg)
  let W = Double(cg.width), H = Double(cg.height)
  let req = VNRecognizeTextRequest()
  req.recognitionLevel = .accurate
  req.usesLanguageCorrection = false
  try? VNImageRequestHandler(cgImage: cg).perform([req])
  for obs in req.results ?? [] {
    guard let cand = obs.topCandidates(1).first else { continue }
    let text = cand.string
    guard let r = text.lowercased().range(of: needle) else { continue }
    var start = text.index(text.startIndex, offsetBy: text.lowercased().distance(from: text.lowercased().startIndex, to: r.lowerBound))
    // from the start of the word the needle is in ("https://", "my-app.")
    while start > text.startIndex, !text[text.index(before: start)].isWhitespace { start = text.index(before: start) }
    guard let bb = try? cand.boundingBox(for: start..<text.endIndex)?.boundingBox else { continue }
    // Vision's boxes are normalised with the origin at the bottom left
    let x = bb.minX * W, w = bb.width * W, h = bb.height * H, y = (1 - bb.maxY) * H
    // the background: the most common colour in a row just above the text
    var counts: [String: Int] = [:]
    for xx in stride(from: Int(x), to: Int(x + w), by: 2) { counts[hex(pixel(rep, xx, Int(y) - 3)), default: 0] += 1 }
    let bgHex = counts.max { $0.value < $1.value }?.key ?? "#ffffff"
    let bg = stride(from: 1, to: 7, by: 2).map { Int(bgHex.dropFirst($0).prefix(2), radix: 16)! }
    var fg = bg, best = 0
    for yy in stride(from: Int(y), to: Int(y + h), by: 2) {
      for xx in stride(from: Int(x), to: Int(x + min(w, h * 6)), by: 2) {
        let p = pixel(rep, xx, yy); let d = dist(p, bg)
        if d > best { best = d; fg = p }
      }
    }
    let rest = String(text[start...])
    let obj: [String: Any] = ["file": path, "line": text, "text": rest, "box": [x, y, w, h].map { ($0 * 10).rounded() / 10 },
                              "image": [W, H], "bg": hex(bg), "fg": hex(fg)]
    let data = try! JSONSerialization.data(withJSONObject: obj, options: [.sortedKeys])
    print(String(data: data, encoding: .utf8)!)
  }
}
