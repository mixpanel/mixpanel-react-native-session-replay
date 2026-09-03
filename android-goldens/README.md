# React Native wireframe goldens

Coordinate goldens for the `mp_wireframe` element list captured over a **React Native** view
tree, rendered off-device by Paparazzi (layoutlib) on the JVM. ~5 seconds, no emulator.

```bash
./gradlew test
```

**46 cases, the same case names as `example/ios/WireframeGoldenTests`** and the same principles
the Android SDK, Flutter and iOS SDK suites pin — the point is that a reviewer can diff platforms
case by case rather than guessing which suite covers what. Each case writes two files: the
element list, and `<name>.masks.json` with the mask rectangles.

**Why the mask companion exists.** Several masking cases are otherwise unfalsifiable: a masked,
unlabelled image has no text to lose, so its element is byte-identical to the unmasked one and
the golden cannot tell whether masking happened at all. Bounds only, no decision label, so the
two React Native suites stay byte-comparable — Android's `SubviewSummary.boundsSnapshot` is a
`Set<Rect>` and carries no decisions at that seam. (The iOS SDK's own companions add a
`decision` field.)

A missing golden is auto-created on first run (written, announced, passes), so adding a case
is a single run. The serialized format is byte-for-byte identical to the Android SDK, Flutter
and iOS suites — 2-space indent, arrays one value per line, `role`/`text`/`bounds`/
`maskDecision` key order, `text: null` literal, no trailing newline — so a reviewer can
eyeball cross-platform parity. Only the coordinates differ per platform, which is why the
files are not shared.

## Why this project exists separately

**Not in `android/src/test`.** The `android/` module is autolinked into every consumer app,
so its `build.gradle` is evaluated by *their* Gradle build. Adding the Paparazzi plugin there
would force every app that installs this package to resolve it. Nothing here is part of the
npm package (it is absent from `files` in `package.json`) or of any consumer build.

**Not covered by the SDK's own goldens.** Those pin the walk over plain `TextView` /
`ImageView` / `ViewGroup`. These pin it over the views React Native actually creates. That
distinction is the whole point: React Native needed *no* Android-specific SDK code precisely
because `ReactTextView` is a `TextView` and `ReactImageView` is an `ImageView` — a standing
assumption about someone else's library, which a React Native upgrade could break with
nothing else noticing.

## Prerequisites

The Session Replay SDK build that carries wireframe support is not published yet, so publish
it to the local Maven cache first:

```bash
cd ../../mixpanel-android-private && ./gradlew :session-replay:publishToMavenLocal
```

## Two React Native facts the harness has to work around

Both cost real time, and both silently produce *passing* tests if you get them wrong.

**`ReactViewGroup.onLayout` is a no-op.** React Native does not use Android layout: Yoga
computes every frame in JS and the ViewManager calls `View.layout(...)` on each child
directly. A child merely `addView`n to a `ReactViewGroup` is therefore never measured, ends up
0x0, and is dropped by the SDK's `width > 0 && height > 0` guard. The first run of this suite
produced two goldens containing `"elements": []` that looked like passing tests. Use
`addReactChild(child, x, y, w, h)`, which records the frame and applies it during the host's
layout pass — exactly what the ViewManager would do.

That is also why `rn_visible_subtree_control.json` exists: an empty golden is only evidence of
suppression if the same tree is non-empty when nothing suppresses it.

**Registered sensitive classes survive `deinitialize()`.** `addSensitiveClass` is a standing
instruction, so the two `class*` cases leaked `ReactTextView` into every case that ran after
them — eight goldens recorded as EXPLICIT with their text nulled, all still passing, and which
ones depended on JUnit's ordering. `resetMaskingState` now calls `removeSensitiveClass`
explicitly. Worth remembering when adding a case that registers anything globally.

**`ReactImageView` reads feature flags through JNI.** It touches
`ReactNativeFeatureFlags` while laying out, and the default accessor resolves them through
`ReactNativeFeatureFlagsCxxInterop` — a native library that does not exist off-device
(`UnsatisfiedLinkError: no react_featureflagsjni`). Call
`ReactNativeFeatureFlagsForTests.setUp()`, which installs the pure-JVM accessor. Note the
public `ReactNativeFeatureFlags.override(...)` does **not** work: it goes through the current
(Cxx) accessor to do the overriding, so it throws the very error you called it to avoid.
Fresco also has to be initialized before the first controller builder is requested.

## What is and is not covered

`ReactEditText` cannot be rendered here — its constructor casts its `Context` to
`ThemedReactContext`, which needs a live React instance. What actually matters about it, that
it is an `EditText` and therefore takes the SDK's always-masked `input` path, is asserted by
`ReactNativeViewContractTest` instead, along with the other class relationships the SDK's
classification depends on.

iOS has no equivalent suite. Fabric's `RCTParagraphComponentView` only exposes its text once a
Fabric mounting cycle has given it C++ state, so it cannot be driven from a unit test; the
iOS-side behaviour is covered by `ReactNativeWireframeTests` in the SDK repo (using
`@objc(RCT…)` stand-ins) and end to end by `samples/rn-snacks`.
