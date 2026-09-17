import XCTest

@testable import MixpanelSessionReplay

/// Coordinate goldens for the wireframe captured over a **real, mounted React Native** hierarchy
/// on iOS.
///
/// **The case list is the cross-platform matrix, name for name with `android-goldens/`**, which
/// in turn mirrors the Android SDK, Flutter and iOS SDK suites. That is the point: the same
/// principle is pinned on every platform, so a reviewer can diff case by case rather than
/// wondering which suite covers what. Where React Native genuinely has no equivalent, the case
/// still exists and pins the *documented* behaviour instead of being dropped —
/// `touchableIsContainer` and `touchableLabelNotNamed` are the clearest examples.
///
/// Hosted by the example app because a React Native surface only exists inside a running app;
/// see `WireframeGoldenHarness` and this directory's README. Content comes from
/// `example/src/WireframeGoldenFixture.tsx`, selected per case by a `scene` prop, with every row
/// absolutely positioned so the numbers are a property of the fixture rather than of the
/// simulator.
///
/// In Debug the host app loads its bundle from Metro, so run through
/// `./scripts/run-ios-goldens.sh` or have `yarn example start` going — otherwise every case
/// skips with an explanatory message rather than failing obscurely.
final class ReactNativeWireframeGoldenTests: XCTestCase {

  /// One case: mount `scene`, walk it, compare against `rn_ios_<name>.json`.
  private func golden(
    _ name: String,
    scene: String,
    autoMaskedViews: Set<MPAutoMaskedViews> = [],
    useAccessibilityLabelFallback: Bool = true,
    rules: [MPSensitiveRule] = [],
    sensitiveClasses: [AnyClass] = [],
    expectedTextRows: Int = 1,
    file: StaticString = #filePath,
    line: UInt = #line
  ) throws {
    let capture = try WireframeGoldenHarness.capture(
      scene: scene,
      autoMaskedViews: autoMaskedViews,
      useAccessibilityLabelFallback: useAccessibilityLabelFallback,
      rules: rules,
      sensitiveClasses: sensitiveClasses,
      expectedTextRows: expectedTextRows)
    WireframeGoldenFormat.assertGolden(capture, "rn_ios_\(name).json", file: file, line: line)
  }

  /// The classes the React Native bridge registers for `.text`, needed by the cases that
  /// exercise text automasking the way a real integration gets it. `maskAllText` alone masks
  /// `UILabel`/`UITextView`, and React Native's text is neither.
  private var reactNativeTextClasses: [AnyClass] {
    ["RCTParagraphTextView", "RCTTextView"].compactMap { NSClassFromString($0) }
  }

  // MARK: - Text

  func test_golden_textPlain() throws { try golden("text_plain", scene: "text") }

  /// Text automasking, the shipped default: place kept, words gone.
  func test_golden_textAutoMasked() throws {
    try golden(
      "text_auto_masked", scene: "text",
      autoMaskedViews: [.text], sensitiveClasses: reactNativeTextClasses)
  }

  func test_golden_textExplicitMasked() throws {
    try golden("text_explicit_masked", scene: "maskedText")
  }

  /// `sensitive={false}` overrides automasking and the text survives.
  func test_golden_textUnmaskOverridesAuto() throws {
    try golden(
      "text_unmask_overrides_auto", scene: "unmaskedText",
      autoMaskedViews: [.text], sensitiveClasses: reactNativeTextClasses)
  }

  /// The 50-char cap, ellipsis included. Same limit on all four platforms.
  func test_golden_textTruncated() throws { try golden("text_truncated", scene: "truncated") }

  /// Visible text is tier 2, so the label flag cannot take it away.
  func test_golden_textFallbackOffKeepsText() throws {
    try golden("text_fallback_off_keeps_text", scene: "text", useAccessibilityLabelFallback: false)
  }

  /// Both a visible string and a label, with the fallback off: the visible text wins.
  ///
  /// The precedence case — `textFallbackOffKeepsText` only shows that text with *no* label
  /// survives, which a bug preferring the label would also satisfy. Matches the Android SDK's
  /// and Flutter's `button_label_fallback_off_with_text`.
  func test_golden_textLabelFallbackOffWithText() throws {
    try golden(
      "text_label_fallback_off_with_text", scene: "textLabelled",
      useAccessibilityLabelFallback: false)
  }

  /// Declared text is taken verbatim, so glyphs the scraper would null survive. The counterpart
  /// to `iconGlyphNulled`, and the Android SDK's `declared_glyph_kept`.
  func test_golden_declaredGlyphKept() throws {
    try golden("declared_glyph_kept", scene: "declaredGlyph")
  }

  /// Private-use-area glyphs only — an icon font — are not human-readable: nulled, shell kept.
  func test_golden_iconGlyphNulled() throws {
    try golden("icon_glyph_nulled", scene: "glyphOnly")
  }

  /// Mixed glyph + words stays: only glyph-*only* text is dropped.
  func test_golden_iconGlyphMixedKept() throws {
    try golden("icon_glyph_mixed_kept", scene: "glyphMixed")
  }

  // MARK: - Image

  func test_golden_imageUnlabeled() throws {
    try golden("image_unlabeled", scene: "image", expectedTextRows: 0)
  }

  func test_golden_imageAutoMasked() throws {
    try golden("image_auto_masked", scene: "image", autoMaskedViews: [.image], expectedTextRows: 0)
  }

  /// A labelled `<Image>`. Never named on iOS: React Native puts accessibility props on
  /// `RCTImageComponentView` while the element comes from the inner `RCTUIImageViewAnimated`,
  /// which has no label of its own. `wireframeText` is the way to describe an image here.
  func test_golden_imageLabel() throws {
    try golden("image_label", scene: "imageLabelled", expectedTextRows: 0)
  }

  /// And with the fallback off it is the same shell — see `test_golden_labelFallbackMakesNoDifference`.
  func test_golden_imageLabelFallbackOff() throws {
    try golden(
      "image_label_fallback_off", scene: "imageLabelled",
      useAccessibilityLabelFallback: false, expectedTextRows: 0)
  }

  func test_golden_imageMaskedDropsLabel() throws {
    try golden("image_masked_drops_label", scene: "imageMaskedLabelled", expectedTextRows: 0)
  }

  // MARK: - Input

  /// A `<TextInput>` is always masked and its value is never scraped.
  func test_golden_inputAlwaysMasked() throws {
    try golden("input_always_masked", scene: "input", expectedTextRows: 0)
  }

  /// An unmask cannot re-expose an input — the one decision nothing overrides.
  func test_golden_inputInUnmaskStillMasked() throws {
    try golden("input_in_unmask_still_masked", scene: "inputInUnmask", expectedTextRows: 0)
  }

  // MARK: - Touchable: React Native has no `button` role, on either platform

  /// `<Pressable>` is a plain container and the `<Text>` inside carries the label. Deliberate,
  /// and identical on Android: a role on one platform only would create a parity gap.
  func test_golden_touchableIsContainer() throws {
    try golden("touchable_is_container", scene: "touchable")
  }

  /// An icon-only touchable cannot be named by its `accessibilityLabel`: the label is on the
  /// container, which has no role and emits no element, while the `<Image>` inside has no label.
  func test_golden_touchableLabelNotNamed() throws {
    try golden("touchable_label_not_named", scene: "touchableLabelled", expectedTextRows: 0)
  }

  func test_golden_touchableMaskedDropsLabel() throws {
    try golden("touchable_masked_drops_label", scene: "touchableMasked")
  }

  // MARK: - Accessibility roles

  /// `<Pressable accessibilityRole="button">` reports a `button`, and — unlike Android — one
  /// element, because iOS closes the subtree once a role is emitted (`newInsideLeaf`). The label
  /// is absorbed from the descendants so the control does not ship textless.
  func test_golden_roleButton() throws { try golden("role_button", scene: "roleButton") }

  func test_golden_roleLink() throws { try golden("role_link", scene: "roleLink") }

  func test_golden_roleHeader() throws { try golden("role_header", scene: "roleHeader") }

  /// Readable on Android, invisible here: UIKit maps `checkbox` to `UIAccessibilityTraitNone`,
  /// so iOS reports no role at all. The case exists on both platforms so the capability
  /// difference shows up in the goldens instead of being hidden by omission.
  func test_golden_roleCheckbox() throws { try golden("role_checkbox", scene: "roleCheckbox") }

  /// Same as checkbox — `switch` is not distinguishable through traits.
  func test_golden_roleSwitch() throws { try golden("role_switch", scene: "roleSwitch") }

  /// A role outside the allowlist is ignored on both platforms. React Native's enum has ~70
  /// members; only mapped ones may appear in the payload, so a new upstream value cannot reach
  /// it unreviewed.
  func test_golden_roleUnmappedIgnored() throws {
    try golden("role_unmapped_ignored", scene: "roleUnmapped")
  }

  /// Taking a role must not become a way to launder masked content into the label, because
  /// `role` is the one field the masking pipeline never filters.
  func test_golden_roleMaskedDescendant() throws {
    try golden("role_masked_descendant", scene: "roleMaskedDescendant", expectedTextRows: 2)
  }

  /// A nested control keeps its own element — the discipline Flutter's `ListTile` fusion lacks.
  func test_golden_roleNestedControl() throws {
    try golden("role_nested_control", scene: "roleNestedControl", expectedTextRows: 2)
  }

  // MARK: - Declared text (`wireframeText`)

  func test_golden_declaredPlainView() throws {
    try golden("declared_plain_view", scene: "declaredPlain", expectedTextRows: 0)
  }

  func test_golden_declaredInput() throws {
    try golden("declared_input", scene: "declaredInput", expectedTextRows: 0)
  }

  func test_golden_declaredMaskImage() throws {
    try golden("declared_mask_image", scene: "declaredMaskImage", expectedTextRows: 0)
  }

  /// A declared *container* has no role of its own, so its real content is still walked.
  func test_golden_declaredContainerKeepsInput() throws {
    try golden("declared_container_keeps_input", scene: "declaredContainer", expectedTextRows: 0)
  }

  /// Declared text is exempt from the geometric strip — authored, not scraped.
  func test_golden_declaredSurvivesGeometric() throws {
    try golden("declared_survives_geometric", scene: "declaredSurvivesGeometric")
  }

  /// Rules run last, over declared text too — the one thing that can still take it away.
  func test_golden_declaredRuleStripped() throws {
    try golden(
      "declared_rule_stripped", scene: "declaredPlain",
      rules: [.strip(text: "spend")], expectedTextRows: 0)
  }

  /// Declared text is never gated by the label flag.
  func test_golden_declaredBeatsLabelFallbackOff() throws {
    try golden(
      "declared_beats_label_fallback_off", scene: "declaredMaskImage",
      useAccessibilityLabelFallback: false, expectedTextRows: 0)
  }

  /// Declared text outranks the view's own visible text.
  func test_golden_declaredBeatsVisible() throws {
    try golden("declared_beats_visible", scene: "declaredBeatsVisible")
  }

  // MARK: - Geometric leak prevention

  func test_golden_geometricOverlapNulled() throws {
    try golden("geometric_overlap_nulled", scene: "geometricOverlap")
  }

  func test_golden_geometricOverlapTextAndImage() throws {
    try golden("geometric_overlap_text_and_image", scene: "geometricTextAndImage")
  }

  /// A mask nested inside an unmask still masks.
  func test_golden_nestedMaskInUnmask() throws {
    try golden("nested_mask_in_unmask", scene: "nestedMaskInUnmask")
  }

  /// An unmask nested inside a mask: the parent's rect still strips it geometrically.
  func test_golden_nestedUnmaskInMaskGeometric() throws {
    try golden("nested_unmask_in_mask_geometric", scene: "nestedUnmaskInMask")
  }

  func test_golden_nestedUnmaskUnderLayoutGeometric() throws {
    try golden("nested_unmask_under_layout_geometric", scene: "nestedUnmaskUnderLayout")
  }

  // MARK: - Sensitive rules

  func test_golden_ruleStrip() throws {
    try golden(
      "rule_strip", scene: "twoTextRows", rules: [.strip(text: "account")], expectedTextRows: 2)
  }

  func test_golden_ruleStripRegex() throws {
    let regex = try NSRegularExpression(pattern: #"\d{4}-\d{4}"#)
    try golden(
      "rule_strip_regex", scene: "twoTextRows", rules: [.stripRegex(regex)], expectedTextRows: 2)
  }

  func test_golden_ruleRedact() throws {
    try golden("rule_redact", scene: "name", rules: [.redact(text: "ada", replacement: "[NAME]")])
  }

  func test_golden_ruleRedactRegex() throws {
    let regex = try NSRegularExpression(pattern: #"[^@\s]+@[^@\s]+"#)
    try golden(
      "rule_redact_regex", scene: "email",
      rules: [.redactRegex(regex, replacement: "[EMAIL]")])
  }

  /// Rules apply to label-derived text too. On iOS an RN image is never named (see
  /// `test_golden_imageLabel`), so this pins that there is nothing for the rule to rewrite —
  /// the honest counterpart to Android's `rn_rule_redact_image_label`.
  func test_golden_ruleRedactImageLabel() throws {
    try golden(
      "rule_redact_image_label", scene: "imageLabelled",
      rules: [.redact(text: "profile", replacement: "[X]")], expectedTextRows: 0)
  }

  // MARK: - The class API: how the bridge masks React Native's own views

  /// `addSensitiveClass` is exactly how the bridge implements `autoMaskedViews` for RN's view
  /// classes, so this is the path a real integration takes. Reports EXPLICIT — a registered
  /// class is a developer opt-in.
  func test_golden_classExplicitMasked() throws {
    try golden("class_explicit_masked", scene: "text", sensitiveClasses: reactNativeTextClasses)
  }

  /// An unmask still overrides a class match.
  func test_golden_classSafeKept() throws {
    try golden(
      "class_safe_kept", scene: "unmaskedText", sensitiveClasses: reactNativeTextClasses)
  }

  // MARK: - Structure and visibility

  /// No content: an empty element list, not a missing event.
  func test_golden_emptyScreen() throws {
    try golden("empty_screen", scene: "empty", expectedTextRows: 0)
  }

  /// `display: none` contributes nothing, and neither do its children.
  func test_golden_hiddenViewsNotEmitted() throws {
    try golden("hidden_views_not_emitted", scene: "hidden", expectedTextRows: 0)
  }

  /// `opacity: 0` paints nothing, so nothing under it may reach the wireframe.
  func test_golden_transparentSubtreeDropped() throws {
    try golden("transparent_subtree_dropped", scene: "transparent", expectedTextRows: 0)
  }

  /// The control for the two above: an empty golden only means suppression if the same tree is
  /// non-empty when nothing suppresses it.
  func test_golden_visibleSubtreeControl() throws {
    try golden("visible_subtree_control", scene: "visibleControl")
  }

  func test_golden_overlappingSiblings() throws {
    try golden("overlapping_siblings", scene: "overlapping", expectedTextRows: 2)
  }

  /// A masked container describes its *structure* rather than disappearing: children ship as
  /// textless shells so the shape of the screen survives.
  func test_golden_maskedContainerDescribesStructure() throws {
    try golden("masked_container_describes_structure", scene: "maskedContainer", expectedTextRows: 2)
  }

  /// A row below the window is not emitted — what a long `FlatList` produces below the fold.
  func test_golden_offscreenContentNotEmitted() throws {
    try golden("offscreen_content_not_emitted", scene: "offscreen", expectedTextRows: 2)
  }

  /// Everything at once: the integration case each platform's suite ends with.
  func test_golden_complexMixedMasking() throws {
    let regex = try NSRegularExpression(pattern: #"[^@\s]+@[^@\s]+"#)
    try golden(
      "complex_mixed_masking", scene: "complex",
      rules: [.redactRegex(regex, replacement: "[EMAIL]")], expectedTextRows: 4)
  }

  // MARK: - The label tier is unreachable on a React Native screen

  /// `useAccessibilityLabelFallback` has no effect here, for two independent reasons — verified
  /// against the mounted hierarchy, not assumed:
  ///
  /// - Text never needs it: Fabric's `attributedText` is tier 2, and the flag governs tier 3.
  /// - Images cannot use it: the label lands on `RCTImageComponentView`, the element comes from
  ///   the inner `RCTUIImageViewAnimated`.
  ///
  /// Asserted as an equality so it cannot rot into a pair of identical goldens that look like
  /// they are testing something.
  func test_golden_labelFallbackMakesNoDifference() throws {
    let off = try WireframeGoldenHarness.capture(
      scene: "complex", useAccessibilityLabelFallback: false, expectedTextRows: 4)
    let on = try WireframeGoldenHarness.capture(
      scene: "complex", useAccessibilityLabelFallback: true, expectedTextRows: 4)

    XCTAssertEqual(
      off.elements.map(\.text), on.elements.map(\.text),
      "the label tier is unreachable on a React Native screen — see this test's documentation")
  }
}
