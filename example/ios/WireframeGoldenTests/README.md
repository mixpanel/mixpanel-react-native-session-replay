# iOS React Native wireframe goldens

Coordinate goldens for the `mp_wireframe` element list captured over a **real, mounted React
Native hierarchy** on iOS. The counterpart to `android-goldens/` at the repo root; together
they give React Native the same golden coverage every other platform has.

```bash
./scripts/run-ios-goldens.sh              # picks a simulator, manages Metro, runs the tests
./scripts/run-ios-goldens.sh <sim-udid>   # or name one
```

That script exists only because Debug loads the bundle from Metro: it starts one if none is
running and stops it again on the way out, reusing a Metro you already have rather than
killing it. Everything else is a plain `xcodebuild test-without-building`. Set `DERIVED_DATA`
to scope the build directory; by default it uses Xcode's shared DerivedData so builds stay
incremental — a private path means rebuilding all ~78 pods every run, roughly 2.8 GB a tree.

**Not wired into CI yet**, deliberately: this suite and `android-goldens/` both depend on SDK
versions that are not published, so a CI job would fail at `pod install` / dependency
resolution rather than on anything real. Wire them up with the version bump.

**46 cases, the same case names as `android-goldens/`** and the same principles the Android SDK,
Flutter and iOS SDK suites pin. Each case writes two files: the element list, and
`<name>.masks.json` with the mask rectangles — without which several masking cases are
unfalsifiable, since a masked unlabelled image has no text to lose and its element is identical
to the unmasked one. Content is selected per case by a `scene` prop passed through
`initialProperties`, so one registered component serves every case.

A missing golden is auto-created (written, announced, passes), so authoring a case is one run.
Format is byte-for-byte the Android/Flutter/iOS-SDK format, so goldens are comparable across
platforms by eye. If Metro is not running the cases **skip** with an explanatory message
rather than failing obscurely.

## Why these are hosted by the example app

Every other golden suite constructs its views directly. This one cannot: Fabric's
`RCTParagraphComponentView` only exposes its text (`attributedText`) once a mounting cycle has
given it C++ shadow-node state, and there is no way to produce that from a plain test bundle.
So the tests run as a **hosted unit test** — test host is the example app — and borrow exactly
one thing from it, a live `RCTRootViewFactory`. Everything after that is the SDK.

The fixture is mounted into a **fresh 320x480 window**, not the app's own, so the viewport is a
property of this suite rather than of whichever simulator is attached. Content comes from
`example/src/WireframeGoldenFixture.tsx`, where every row is absolutely positioned — the
numbers are a property of the fixture, not of system-font metrics. That is the same discipline
the SwiftUI golden needed after the running simulator's safe-area inset silently pinned it to
one device model. Confirmed in practice: the goldens were recorded on an iPhone 16 and compare
green on an iPhone 16 Pro.

## Two things the harness has to do, and why

**Mirror the bridge's `addSensitiveClass` calls.** `maskAllText` masks `UILabel`/`UITextView`,
and React Native's text is neither — so a golden captured with `.text` in `autoMaskedViews`
first came back *fully quoted*, the opposite of what a real integration produces. On iOS it is
the **bridge** that masks RN text, by registering `RCTParagraphTextView` / `RCTTextView`
through the public `addSensitiveClass`. `WireframeGoldenHarness` does the same, so the goldens
describe what an app actually ships. Keeping those two lists in step is a large part of the
value of testing here rather than over synthetic views.

**Wait for layout, not just for mount.** They are separate on Fabric: a paragraph can carry
its string while its frame is still zero, and a golden captured at that moment would record
`0,0,0,0` bounds and pass. The harness polls until four text rows are both text-bearing *and*
laid out.

## A finding these tests pin

`useAccessibilityLabelFallback` has **no effect on a React Native screen on iOS**, for two
independent reasons — verified against the mounted hierarchy, not assumed:

- Text never needs it. Fabric's `attributedText` is read as tier 2, and the flag governs
  tier 3 only.
- Images cannot use it. React Native sets accessibility props on the *component* view, so the
  label lands on `RCTImageComponentView`, while the wireframe element comes from the inner
  `RCTUIImageViewAnimated`, which has no label of its own. An
  `<Image accessibilityLabel="…">` is therefore never named at either setting, and
  `wireframeText` is the only way to describe an image here.

`test_golden_labelFallbackMakesNoDifference` asserts the two settings produce equal text rather
than shipping two identical goldens that would look like they were testing something.

**A related consequence worth knowing when diffing against Android:** because a label never
reaches the element here, `image_label`, `image_label_fallback_off` and
`rule_redact_image_label` all come back as the same textless shell, where Android names the
image. The masking still shows up — in the `.masks.json` companion — which is exactly why that
file exists.

**And one decision label differs by platform for the same masking.** iOS reports GEOMETRIC where
Android reports EXPLICIT or AUTO for text cases, because the bridge registers the *inner*
`RCTParagraphTextView`: the element sits on the parent component view and is stripped by the
geometric layer rather than being the masked view itself. Same principle, same nulled text,
different label — not a bug.

## Project wiring

Added to the example app's project with the `xcodeproj` gem rather than by hand: a
`unit_test_bundle` target with `TEST_HOST` pointing at the app, `inherit! :search_paths` in the
Podfile, and the target added to the shared scheme's test action. `IPHONEOS_DEPLOYMENT_TARGET`
has to match the host app's or `@testable import` of the app module fails to load. The app's
own code is untouched — `@testable` is what makes its `reactNativeFactory` reachable, since a
plain Swift property is not key-value-coding compliant.
