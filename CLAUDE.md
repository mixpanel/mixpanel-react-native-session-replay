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

## Important Notes

- **Yarn Required**: Cannot use npm due to workspace dependencies
- **New Architecture**: Supports both old and new RN architectures
- **Native Development**: Open `example/android` in Android Studio or `example/ios/MixpanelReactNativeSessionReplayExample.xcworkspace` in Xcode
- **Builder Bob**: Uses react-native-builder-bob for ESM + TypeScript builds