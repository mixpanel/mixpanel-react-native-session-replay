# Mixpanel React Native Session Replay

Official React Native turbo module for Mixpanel Session Replay. Capture and analyze user interactions in your mobile app by bridging Mixpanel's native iOS and Android session replay SDKs to React Native.

## Features

- 🎥 **Session Recording** - Capture user interactions and screen recordings
- 🔒 **Privacy First** - Built-in data masking for sensitive information
- ⚡ **High Performance** - Native implementation with minimal JavaScript overhead
- 🎯 **Selective Recording** - Configurable sampling rates and recording controls
- 📱 **Cross Platform** - Unified API for both iOS and Android
- 🚀 **New Architecture Ready** - Built as a Turbo Module for React Native's new architecture

## Installation

### npm
```sh
# Install latest version
npm install "https://github.com/mixpanel/mixpanel-react-native-session-replay.git"

# Install specific version
npm install "https://github.com/mixpanel/mixpanel-react-native-session-replay.git#version"
```

### yarn
```sh
# Install latest version
yarn add github:mixpanel/mixpanel-react-native-session-replay

# Install specific version
yarn add github:mixpanel/mixpanel-react-native-session-replay#version
```

### Platform Setup

#### iOS
The SDK dependencies are automatically added via CocoaPods. Your project must target iOS 13 or later.

```sh
cd ios && pod install
```

#### Android
Dependencies are automatically added through Gradle. Requirements:
- Minimum Android SDK 21+
- Kotlin support enabled

## Quick Start

```typescript
import {
  initialize,
  startRecording,
  stopRecording,
  isRecording,
  MPSessionReplayConfig,
  MPSessionReplayMask,
} from 'mixpanel-react-native-session-replay';

// Initialize session replay
const config = new MPSessionReplayConfig({
  wifiOnly: false,
  recordingSessionsPercent: 100,
  autoStartRecording: true,
  autoMaskedViews: [MPSessionReplayMask.Image, MPSessionReplayMask.Text],
  flushInterval: 5,
  enableLogging: true,
});

await initialize(token, distinctId, config).catch((error) => {
  console.error('Initialization error:', error);
});

// Control recording
await startRecording();
await stopRecording();

// Check recording status
const recording = await isRecording();
```

## Configuration

### MPSessionReplayConfig

```typescript
class MPSessionReplayConfig {
  wifiOnly: boolean;                         // Only transmit on WiFi (default: true)
  recordingSessionsPercent: number;          // Sampling rate 0-100 (default: 100)
  autoMaskedViews: MPSessionReplayMask[];    // Views to auto-mask (default: all)
  autoStartRecording: boolean;               // Start recording automatically (default: true)
  flushInterval: number;                     // Flush interval in seconds (default: 10)
  enableLogging: boolean;                    // Enable verbose logging (default: false)
}
```

### Configuration Options

#### wifiOnly
Controls whether replay events are sent only over WiFi.

- **true** - Events are flushed only when connected to WiFi. Without WiFi, events remain queued until connection is restored or the queue reaches capacity.
- **false** - Events are flushed over any network connection, including cellular.
- **Default:** `true`

#### recordingSessionsPercent
Sets the sampling rate for automatic session recording.

Accepts values from 0 to 100, representing the percentage of sessions that will automatically start recording.

- **0** - No automatic recording
- **100** - Record all sessions
- **Default:** `100`
- **Note:** This only applies to automatic recording. Manual calls to `startRecording()` are not affected.

#### autoMaskedViews
Specifies which view types are automatically masked by the SDK.

By default, the SDK masks image, text, web, and map views (iOS only). You can customize this behavior through configuration.

#### autoStartRecording
Determines whether recording starts automatically on initialization.

- **true** - Recording starts automatically when initialized. The SDK stops and restarts recording as the app moves between background and foreground. Each new session uses `recordingSessionsPercent` to determine if recording should begin.
- **false** - Recording only starts when you explicitly call `startRecording()`.
- **Default:** `true`

#### flushInterval
Sets how often screenshots are sent to Mixpanel, in seconds.

Screenshots are collected in batches of 10 and sent after each flush interval. Adjust this value to control how quickly screenshots are uploaded.

- **Default:** `10` seconds

#### enableLogging
Enables debug logging for development and troubleshooting.

- **true** - Prints verbose debug logs including internal events, configuration status etc...
- **false** - No logs from the Session Replay SDK will be printed.
- **Default:** `false`

## API Methods

### initialize(token: string, distinctId: string, config: MPSessionReplayConfig): Promise<void>
Initializes the session replay system with your configuration. Checks remote settings to confirm recording is enabled, then creates a new session replay instance. Any existing instance is deinitialized first.

**Returns:** Promise that resolves when initialization completes successfully.

**Throws:** Error if initialization fails.

### startRecording(): Promise<void>
Manually starts session recording. Has no effect if recording is already active.

Recording continues until you stop it manually or the app moves to the background.

### stopRecording(): Promise<void>
Stops the current recording session and performs cleanup.

### isRecording(): Promise<boolean>
Returns whether recording is currently active.

### identify(distinctId: string): Promise<void>
Updates the distinct ID for session replays after initialization.

**Best practice:** Call `identify()` on the main Mixpanel SDK first, then call it on the Session Replay SDK. This ensures users are properly merged.

## Privacy & Security

The SDK automatically masks sensitive information to protect user privacy. Text input fields are always masked and cannot be disabled.

Additional configurable masking options:
- Images
- Text elements
- WebView content
- Apple Maps (iOS only)

## Example App

Test the integration using the example app:

```sh
# Install dependencies
yarn

# Start Metro bundler
yarn example start

# Run on iOS
yarn example ios

# Run on Android
yarn example android
```

## Requirements

- React Native 0.70 or higher
- iOS 13.0 or higher
- Android API Level 21 or higher
- New Architecture support

## Contributing

See our [contributing guide](CONTRIBUTING.md) to learn how to contribute and understand the development workflow.

## License

MIT
