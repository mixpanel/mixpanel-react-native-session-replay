# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the official React Native package for Mixpanel Session Replay. It's a **Turbo Module** built with the New Architecture support, providing native implementations for both iOS (Objective-C/Swift) and Android (Kotlin). The project follows a monorepo structure with Yarn workspaces.

## Development Commands

Essential commands for development:

- `yarn` - Install dependencies (required first step)
- `yarn lint` - Lint code with ESLint
- `yarn typecheck` - Type check with TypeScript  
- `yarn test` - Run Jest unit tests
- `yarn prepare` - Build library package using react-native-builder-bob
- `yarn clean` - Clean all build artifacts

### Example App Commands

- `yarn example start` - Start Metro packager
- `yarn example android` - Run example app on Android
- `yarn example ios` - Run example app on iOS

### Platform-Specific Builds

- `yarn turbo run build:android` - Build Android native module
- `yarn turbo run build:ios` - Build iOS native module

## Architecture

### Core Structure

- **src/index.tsx** - Main entry point, exports library functions
- **src/NativeMixpanelReactNativeSessionReplay.ts** - TurboModule specification interface
- **android/** - Native Android implementation (Kotlin)
- **ios/** - Native iOS implementation (Objective-C/C++)
- **example/** - React Native example app demonstrating usage

### Key Architectural Elements

This is a **React Native Turbo Module** that:
- Uses TurboModuleRegistry for native module registration
- Implements codegen specifications for type safety
- Follows New Architecture patterns with Fabric renderer support
- Bridges JavaScript to native iOS (Objective-C) and Android (Kotlin) implementations

### Native Module Implementation

The native modules inherit from generated specs:
- **Android**: `MixpanelReactNativeSessionReplayModule` extends `NativeMixpanelReactNativeSessionReplaySpec`
- **iOS**: Implements `NativeMixpanelReactNativeSessionReplaySpecJSI` protocol

### Codegen Configuration

The `codegenConfig` in package.json generates:
- TypeScript interfaces from native specifications
- Native module boilerplate for both platforms
- Type-safe bridges between JS and native code

## Testing & Quality

- Jest configuration excludes `example/node_modules` and `lib/` directories
- Pre-commit hooks run linting, type checking, and commit message validation
- CI pipeline runs on Ubuntu (lint, test, Android build) and macOS (iOS build)
- Uses Turbo for build caching and optimization

## Development Workflow

1. **Setup**: Run `yarn` to install dependencies
2. **Development**: Use example app for testing changes (`yarn example start`)
3. **Native Changes**: Rebuild example app after modifying native code
4. **Quality Checks**: Run `yarn lint`, `yarn typecheck`, and `yarn test`
5. **Building**: Use `yarn prepare` to build the library package

## Release Process

- Uses `release-it` with conventional changelog
- Follows conventional commit format (feat, fix, docs, etc.)
- Automated via `yarn release` command

## Wireframes

Wireframe capture (`MPSessionReplayConfig.wireframesOptions`, and the `wireframeText` prop
on `MPSessionReplayView`) is a thin pass-through: this package builds no wireframes itself,
it only lets the native SDKs know to. Two consequences worth knowing before editing:

- **`wireframesOptions` needs no per-platform transformation.** Android's
  `SensitiveRuleSerializer` and iOS's `MPSensitiveRule` decoder were written against the
  same field names and `type` tokens, so `serializeWireframesOptions` emits one payload for
  both — unlike `autoMaskedViews` and `remoteSettingsMode`, which still need case
  conversion. `src/__tests__/index.test.tsx` asserts the two platforms produce an identical
  object; keep it in step with `WireframesOptionsTest.kt` and
  `MPWireframesOptionsCodableTests.swift` in the SDK repos.
- **The debug emitter is configured, not toggled.** The SDKs expose
  `DebugOptions.wireframeEmitter` as a native closure, which cannot cross as JSON, so JS sends an
  `emitWireframes` boolean inside `debugOptions` and each bridge attaches the destination the
  config could not carry, at `initialize` time.
  **The flag belongs to this package, not to the SDKs.** An intermediate version promoted it to a
  real serializable property of `DebugOptions` on both SDKs, on the grounds that a bridge reading
  a key out of the raw payload was a side channel. That was the wrong trade: no SDK code ever read
  the property, so it left a public, settable, permanently inert knob on two GA native API
  surfaces. It is now read by each bridge from the payload it already parses — `BridgeDebugFlags`
  on iOS, the existing `JSONObject` on Android — and neither SDK models it. If you find yourself
  adding an SDK property that only a bridge reads, this is the precedent against it.
  There is deliberately **no runtime setter** on either SDK or in the spec — an intermediate
  version added `setWireframeDebugEmitter`/`setWireframeDebugEnabled` and it was removed on the
  grounds that this should be configurable only, not flippable at runtime by anything holding the
  instance. `MPSessionReplay` exposes no such method and a test asserts that.
- Snapshots cross as the SDK's own `toJson()` **string**, parsed in JS — both SDKs already own
  that serializer, so forwarding it verbatim keeps the bridge from becoming a third place the
  shape can drift. iOS subclasses `RCTEventEmitter` (which also supplies the
  `addListener`/`removeListeners` the TurboModule spec declares); Android emits over
  `RCTDeviceEventEmitter` and no-ops those two.
- **Coordinate goldens live in `android-goldens/`**, a standalone Gradle project (Paparazzi,
  off-device, ~5s) that is deliberately *not* part of the npm package: the `android/` module is
  autolinked into consumer apps, so a Paparazzi plugin in its `build.gradle` would force every
  consumer to resolve it. Run with `cd android-goldens && ./gradlew test`. Two React Native
  facts the harness had to account for, both worth knowing before adding a case:
  `ReactViewGroup.onLayout` is a **no-op** (Yoga lays out from JS, so a merely `addView`n child
  is 0x0 and gets dropped — use `addReactChild`), and `ReactImageView` reads feature flags
  through JNI (use `ReactNativeFeatureFlagsForTests.setUp()`, not the public
  `override(...)`, which itself goes through the native accessor).
- **The SDK pins are load-bearing.** Wireframes require SDK versions newer than what was
  previously pinned; both `android/build.gradle` and the podspec carry a `RELEASE:` comment,
  and `android/` / `ios/` will not compile against the older versions. The dependency pins
  intentionally remain unavailable until the native SDK release process publishes them.

## Important Notes

- **Yarn Required**: Cannot use npm due to workspace dependencies
- **New Architecture**: Supports both old and new RN architectures
- **Native Development**: Open `example/android` in Android Studio or `example/ios/MixpanelReactNativeSessionReplayExample.xcworkspace` in Xcode
- **Builder Bob**: Uses react-native-builder-bob for ESM + TypeScript builds
