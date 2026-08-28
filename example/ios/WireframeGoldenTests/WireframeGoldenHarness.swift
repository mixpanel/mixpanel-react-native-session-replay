import React_RCTAppDelegate
import UIKit
import XCTest

// The host app, imported for one property: the live `RCTReactNativeFactory`. `@testable`
// rather than KVC because `reactNativeFactory` is a plain Swift property and therefore not
// key-value-coding compliant — reading it that way throws `NSUnknownKeyException` at runtime.
// This keeps the app's own code free of test-only annotations.
@testable import MixpanelReactNativeSessionReplayExample
@testable import MixpanelSessionReplay

/// Mounts the React Native golden fixture and runs the SDK's real masking pipeline over it.
///
/// **Why the goldens need a running app.** Fabric's `RCTParagraphComponentView` only exposes
/// its text (`attributedText`) once a mounting cycle has given it C++ shadow-node state. There
/// is no way to construct one with text from a plain test bundle, which is why these tests are
/// hosted by the example app rather than living beside the SDK's own suites. The app supplies
/// exactly one thing — a live `RCTRootViewFactory` — and everything after that is the SDK.
///
/// The fixture is mounted into a **fresh window of a fixed size**, not into the app's own
/// window, so the captured viewport is a property of this file rather than of whichever
/// simulator is attached. Combined with the fixture's absolute positioning, that is what makes
/// the goldens portable across devices; it is the same discipline the SwiftUI golden needed
/// after the running simulator's safe-area inset silently pinned it to one device model.
enum WireframeGoldenHarness {

  /// Flattened element, ready for serialization. Mirrors the SDK's `WireframeElement` but keeps
  /// the golden format independent of a type the SDK is free to reshape.
  struct Element {
    let role: String
    let text: String?
    let bounds: [Int]
    let maskDecision: String
  }

  struct Capture {
    let elements: [Element]
    let viewport: [Int]
    /// The mask rectangles the screenshot would paint.
    ///
    /// Recorded because several masking cases are otherwise unfalsifiable: a masked, unlabelled
    /// image has no text to lose, so its element is byte-identical to the unmasked one and the
    /// golden cannot tell whether masking happened at all. Written to `<name>.masks.json`,
    /// mirroring the iOS SDK's own companion files and matching `android-goldens/` exactly.
    let maskFrames: [[Int]]
  }

  /// Window size every golden is measured in. Chosen to be smaller than any simulator so the
  /// fixture is never clipped, and fixed so the viewport never moves.
  static let windowSize = CGSize(width: 320, height: 480)

  /// Mounts the fixture, waits for React Native to lay it out, then walks it.
  ///
  /// - Parameters:
  ///   - autoMaskedViews: what the SDK should auto-mask. Empty for most cases — these goldens
  ///     exist to see text, and masking everything would make them all identical shells.
  ///   - useAccessibilityLabelFallback: the label tier. On by default here so the labelled
  ///     cases have something to assert; the `*_fallbackOff_*` cases turn it back off.
  ///   - rules: content rules, applied by the emitter after the walk.
  /// - Parameter scene: which fixture to mount, from `WireframeGoldenFixture.tsx`'s `SCENES`.
  ///   Passed through `initialProperties`, so one registered component serves every case.
  /// - Parameter sensitiveClasses: extra classes to register through `addSensitiveClass`, for
  ///   the cases that exercise the class API directly.
  /// - Parameter expectedTextRows: how many laid-out, text-bearing paragraphs to wait for
  ///   before capturing. Scenes with no text at all pass `0`.
  static func capture(
    scene: String,
    autoMaskedViews: Set<MPAutoMaskedViews> = [],
    useAccessibilityLabelFallback: Bool = true,
    rules: [MPSensitiveRule] = [],
    sensitiveClasses: [AnyClass] = [],
    expectedTextRows: Int = 1,
    timeout: TimeInterval = 30
  ) throws -> Capture {
    let manager = try reset(
      autoMaskedViews: autoMaskedViews,
      useAccessibilityLabelFallback: useAccessibilityLabelFallback,
      extraSensitiveClasses: sensitiveClasses)

    let window = UIWindow(frame: CGRect(origin: .zero, size: windowSize))
    let surface = try mountFixture(scene: scene)
    surface.frame = window.bounds
    window.addSubview(surface)
    window.isHidden = false
    defer { surface.removeFromSuperview() }

    try waitForMount(in: window, expectedTextRows: expectedTextRows, timeout: timeout)

    // Force a final layout pass so every mounted view has its frame before the walk. Mounting
    // and layout are separate on Fabric: text can exist while its frame is still zero.
    window.setNeedsLayout()
    window.layoutIfNeeded()

    let result = manager.collectFramesAndWireframes(in: surface, window: window)
    let emitter = WireframeEmitter(
      options: MPWireframesOptions(
        sensitiveRules: rules,
        useAccessibilityLabelFallback: useAccessibilityLabelFallback))
    let processed = result.wireframes.map {
      emitter.applyMaskingPipeline($0, maskBounds: Set(result.frames.keys))
    }

    // Sorted by (y, x): the walk's order follows the view hierarchy, which React Native is
    // free to reorder between versions. Reading order is a property of the screen and is what
    // a reviewer comparing platforms actually wants.
    let elements = processed
      .map {
        Element(
          role: $0.role.wireName,
          text: emitter.wireText(for: $0),
          bounds: [$0.x, $0.y, $0.w, $0.h],
          maskDecision: $0.decision.rawValue)
      }
      .sorted { ($0.bounds[1], $0.bounds[0]) < ($1.bounds[1], $1.bounds[0]) }

    // Bounds only, no decision label, so the two React Native suites are byte-comparable:
    // Android's `SubviewSummary.boundsSnapshot` is a `Set<Rect>` and carries no decisions at
    // that seam. (The iOS SDK's own companions do include a `decision` field.)
    let maskFrames = result.frames.keys
      .map { rect -> [Int] in
        let r = rect.cgRect
        return [
          Int(r.origin.x.rounded()), Int(r.origin.y.rounded()),
          Int(r.width.rounded()), Int(r.height.rounded()),
        ]
      }
      .sorted { ($0[1], $0[0]) < ($1[1], $1[0]) }

    return Capture(
      elements: elements,
      viewport: [Int(windowSize.width), Int(windowSize.height)],
      maskFrames: maskFrames)
  }

  // MARK: - Private

  private static func reset(
    autoMaskedViews: Set<MPAutoMaskedViews>,
    useAccessibilityLabelFallback: Bool,
    extraSensitiveClasses: [AnyClass]
  ) throws -> SensitiveViewManager {
    SensitiveViewManager.reset()
    let manager = SensitiveViewManager.shared
    manager.wireframeCollectionEnabled = true
    manager.maskAllText = autoMaskedViews.contains(.text)
    manager.maskAllImages = autoMaskedViews.contains(.image)
    manager.maskAllWebViews = autoMaskedViews.contains(.web)
    manager.maskAllMapViews = autoMaskedViews.contains(.map)
    manager.useAccessibilityLabelFallback = useAccessibilityLabelFallback

    // Mirror what the React Native bridge does at `initialize`.
    //
    // Without this the goldens are misleading rather than wrong: `maskAllText` masks
    // `UILabel`/`UITextView`, and React Native's text is neither, so a golden captured with
    // `.text` in `autoMaskedViews` came back fully quoted — the opposite of what a real
    // integration produces. On iOS it is the *bridge* that masks RN text, by registering these
    // classes through the public `addSensitiveClass` (see
    // `MixpanelSwiftSessionReplay.setSensitiveClasses`). Keeping the two in step is the whole
    // point of testing here rather than over synthetic views.
    var sensitiveClasses: [AnyClass] = []
    if autoMaskedViews.contains(.text) {
      // Fabric's inner drawing view and Paper's text view, exactly as the bridge registers them.
      for name in ["RCTParagraphTextView", "RCTTextView"] {
        if let cls = NSClassFromString(name) { sensitiveClasses.append(cls) }
      }
    }
    if autoMaskedViews.contains(.image) {
      // Paper only: Fabric's image is a real `UIImageView` subclass, so `maskAllImages` sees it.
      if let cls = NSClassFromString("RCTImageView") { sensitiveClasses.append(cls) }
    }
    // `SensitiveViewManager.reset()` above replaces the shared instance outright, so nothing
    // registered by a previous case can leak into this one. (On Android the equivalent state
    // *does* survive `deinitialize()`, and leaving it uncleared silently masked eight goldens
    // there — see `ReactNativePaparazziHarness.resetMaskingState`.)
    manager.sensitiveClasses = sensitiveClasses + extraSensitiveClasses
    return manager
  }

  /// The app's own React Native factory, which is the only thing borrowed from the host.
  private static func mountFixture(scene: String) throws -> UIView {
    let delegate = try XCTUnwrap(
      UIApplication.shared.delegate as? AppDelegate,
      "these tests must be hosted by the example app")
    let factory = try XCTUnwrap(
      delegate.reactNativeFactory,
      "the host app has not started React Native yet")
    return factory.rootViewFactory.view(
      withModuleName: "WireframeGolden", initialProperties: ["scene": scene])
  }

  /// Waits until the surface has mounted text-bearing Fabric views *and* laid them out.
  ///
  /// Polling rather than a notification because there is no public "surface did mount" hook,
  /// and because mounting alone is not enough: a paragraph can carry its string while its frame
  /// is still zero, and a golden captured then would record `0,0,0,0` bounds and pass.
  private static func waitForMount(
    in window: UIWindow, expectedTextRows: Int, timeout: TimeInterval
  ) throws {
    let deadline = Date().addingTimeInterval(timeout)
    while Date() < deadline {
      RunLoop.current.run(until: Date().addingTimeInterval(0.05))
      window.layoutIfNeeded()
      var laidOutParagraphs = 0
      walk(window) { view in
        guard String(describing: type(of: view)) == "RCTParagraphComponentView",
          view.bounds.width > 1, view.bounds.height > 1,
          let attributed = view.value(forKey: "attributedText") as? NSAttributedString,
          !attributed.string.isEmpty
        else { return }
        laidOutParagraphs += 1
      }
      // Requiring the scene's full row count avoids capturing a half-mounted tree, which
      // would silently produce a golden with missing elements and still pass.
      if laidOutParagraphs >= expectedTextRows { return }
    }
    if expectedTextRows == 0 {
      // A scene with no text has nothing to wait for; one run loop turn was enough.
      return
    }
    throw XCTSkip(
      "React Native never mounted the golden fixture within \(Int(timeout))s. "
        + "In Debug this usually means Metro is not running: `yarn example start`.")
  }

  private static func walk(_ view: UIView, _ visit: (UIView) -> Void) {
    visit(view)
    for sub in view.subviews { walk(sub, visit) }
  }
}
