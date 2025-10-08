# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-10-08

### Added
- Initial public release of Mixpanel React Native Session Replay
- Session recording with native iOS and Android implementations
- `initialize()` method to set up session replay with configuration
- `startRecording()` method to manually start recording
- `stopRecording()` method to stop current recording session
- `isRecording()` method to check recording status (Android support)
- `identify()` method to update distinct ID after initialization
- `MPSessionReplayConfig` for configurable recording options:
  - WiFi-only transmission mode
  - Recording sessions percentage (sampling)
  - Auto-masked views configuration
  - Auto-start recording option
  - Configurable flush interval
  - Debug logging toggle
- Privacy features with automatic masking for sensitive data
- Support for React Native New Architecture (Turbo Modules)
- Cross-platform support for iOS 13+ and Android API 21+

### Changed
- Package scoped under `@mixpanel` organization
- Package set to public access for npm publishing

### Fixed
- TypeScript type definitions for all public APIs
- Native module registration for both platforms
