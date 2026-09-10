import Foundation
import MixpanelSessionReplay
import XCTest

/// Golden ("snapshot") assertion for the `mp_wireframe` element list.
///
/// The serialized **format** is byte-for-byte identical to the Android, Flutter and iOS SDK
/// suites, so a reviewer can eyeball cross-platform parity:
///
/// - 2-space indent, arrays expanded one value per line
/// - key order: `role`, `text`, `bounds`, `maskDecision`
/// - `text` is the JSON literal `null` when the element carries no text
/// - no trailing newline, byte-exact string comparison
///
/// A missing golden is auto-created (written, announced, passes), so authoring a case is a
/// single run. Goldens are resolved through `#filePath` rather than the bundle, because they
/// belong to the source tree, not to the app that happens to host the test.
enum WireframeGoldenFormat {

  private static var goldenDir: URL {
    URL(fileURLWithPath: #filePath)
      .deletingLastPathComponent()
      .appendingPathComponent("Golden")
  }

  static func assertGolden(
    _ capture: WireframeGoldenHarness.Capture,
    _ golden: String,
    file: StaticString = #filePath,
    line: UInt = #line
  ) {
    assertText(
      maskJson(capture.maskFrames),
      golden.replacingOccurrences(of: ".json", with: ".masks.json"),
      file: file, line: line)
    assertText(
      json(viewport: capture.viewport, elements: capture.elements), golden,
      file: file, line: line)
  }

  /// Writes or compares one golden file.
  private static func assertText(
    _ actual: String, _ golden: String, file: StaticString, line: UInt
  ) {
    let url = goldenDir.appendingPathComponent(golden)

    guard let existing = try? String(contentsOf: url, encoding: .utf8) else {
      try? FileManager.default.createDirectory(
        at: goldenDir, withIntermediateDirectories: true)
      do {
        try actual.write(to: url, atomically: true, encoding: .utf8)
        print("📸 Created wireframe golden: \(golden) -> \(url.path)")
      } catch {
        XCTFail("could not write golden \(golden): \(error)", file: file, line: line)
      }
      return
    }

    XCTAssertEqual(
      existing, actual,
      """
      Wireframe golden mismatch for \(golden).
      If this change is intended, delete \(url.path) and re-run to regenerate.
      """,
      file: file, line: line)
  }

  /// Mask rectangles, in the same shape `android-goldens/` writes.
  private static func maskJson(_ frames: [[Int]]) -> String {
    if frames.isEmpty { return "{\n  \"maskFrames\": []\n}" }
    var out = "{\n  \"maskFrames\": [\n"
    for (i, f) in frames.enumerated() {
      out += "    { \"bounds\": [\(f[0]), \(f[1]), \(f[2]), \(f[3])] }"
      out += (i == frames.count - 1 ? "\n" : ",\n")
    }
    return out + "  ]\n}"
  }

  // MARK: - Serialization

  private static func json(
    viewport: [Int], elements: [WireframeGoldenHarness.Element]
  ) -> String {
    var out = "{\n"
    out += "  \"viewport\": [\n"
    for (i, v) in viewport.enumerated() {
      out += "    \(v)" + (i == viewport.count - 1 ? "\n" : ",\n")
    }
    out += "  ],\n"
    if elements.isEmpty {
      out += "  \"elements\": []\n"
    } else {
      out += "  \"elements\": [\n"
      for (i, e) in elements.enumerated() {
        out += "    {\n"
        out += "      \"role\": \(quote(e.role)),\n"
        out += "      \"text\": \(e.text.map(quote) ?? "null"),\n"
        out += "      \"bounds\": [\n"
        out += "        \(e.bounds[0]),\n"
        out += "        \(e.bounds[1]),\n"
        out += "        \(e.bounds[2]),\n"
        out += "        \(e.bounds[3])\n"
        out += "      ],\n"
        out += "      \"maskDecision\": \(quote(e.maskDecision))\n"
        out += (i == elements.count - 1 ? "    }\n" : "    },\n")
      }
      out += "  ]\n"
    }
    out += "}"
    return out
  }

  private static func quote(_ s: String) -> String {
    var out = "\""
    for ch in s.unicodeScalars {
      switch ch {
        case "\"": out += "\\\""
        case "\\": out += "\\\\"
        case "\n": out += "\\n"
        case "\r": out += "\\r"
        case "\t": out += "\\t"
        default:
          if ch.value < 0x20 {
            out += String(format: "\\u%04x", ch.value)
          } else {
            out.unicodeScalars.append(ch)
          }
      }
    }
    return out + "\""
  }
}
