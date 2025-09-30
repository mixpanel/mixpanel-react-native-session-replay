# Mixpanel React Native Session Replay

Official React Native turbo module for Mixpanel Session Replay. This package bridges Mixpanel's native iOS and Android session replay SDKs to React Native, enabling you to capture and analyze user interactions in your mobile applications.

## Features

- 🎥 **Session Recording**: Capture user interactions and screen recordings
- 🔒 **Privacy First**: Built-in data masking for sensitive information
- ⚡ **High Performance**: Native implementation with minimal JavaScript bridge overhead
- 🎯 **Selective Recording**: Configurable sampling rates and recording controls
- 📱 **Cross Platform**: Supports both iOS and Android with unified API
- 🚀 **New Architecture**: Built as a Turbo Module for React Native's new architecture

## Installation
### Using npm
```sh
// install latest
npm install "https://github.com/mixpanel/mixpanel-react-native-session-replay.git"

// install version
npm install "https://github.com/mixpanel/mixpanel-react-native-session-replay.git#version"
```
### Using yarn
```sh
// install latest
yarn add github:mixpanel/mixpanel-react-native-session-replay

// install version
yarn add github:mixpanel/mixpanel-react-native-session-replay#version
```

### iOS Setup
The required SDK dependencies will be automatically added by plugin to the pod. Make sure your project targets iOS 13 or later.

Run:

```sh
cd ios && pod install
```

### Android Setup

The required dependencies will be automatically added through Gradle. Ensure your project uses:
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
const config: MPSessionReplayConfig = new MPSessionReplayConfig({
  wifiOnly: false,
  recordingSessionsPercent: 100,
  autoStartRecording: true,
  autoMaskedViews: [MPSessionReplayMask.Image, MPSessionReplayMask.Text],
  flushInterval: 5,
  enableLogging: true,
})

await initialize(token, distinctId, config).catch((error) => {
  console.error('Initialization error:', error);
});

// Control recording
await startRecording();
await stopRecording();

// Check recording status
const recording = await isRecording();
```

## API Reference

### Configuration

```typescript
class MPSessionReplayConfig {
  wifiOnly: boolean;                         // Only transmit on WiFi (default: true)
  recordingSessionsPercent: number;          // Sampling rate 0-100 (default: 100)
  autoMaskedViews: MPSessionReplayMask[];    // Views to auto-mask (default: all)
  autoStartRecording: boolean;               // Start recording automatically (default: true)
  flushInterval: number;                     // Interval to flush data in seconds (default: 10)
  enableLogging: boolean;                    // Enable verbose logging (default: false)      
}
```

#### 1. wifiOnly
  Determines whether replay events will only be flushed to the server when the device has a WiFi connection.
  
  When set to `true`, replay events will only be flushed to the server when the device has a WiFi connection.
  If there is no WiFi, flushes are skipped and the events remain in the in-memory queue until WiFi is restored (or until the queue reaches its limit and the oldest events are evicted to make room for newer events).
  
When set to `false`, replay events will be flushed with any network connection, including cellular.
  Default: `true`

#### 2. recordingSessionsPercent
  Controls the sampling rate for automatically started recording session replays.
  
  This value (between 0.0 and 100.0) defines the percentage of sessions that will automatically start recording when a new session begins.
  
  - At 0.0, no sessions will be auto-recorded.
  - At 100.0, all sessions will be auto-recorded.
  - Default: 100
  - This setting is not used when invoking `startRecording()` manually.


#### 3. autoMaskedViews
Returns the set of views that are automatically masked by the SDK.
By default, image, text, web, and map(only for iOS) views are masked.
This default behavior can be overridden through the configuration.

#### 4. autoStartRecording
  Determines whether or not the SDK will automatically start recording session replays upon initialization.
  
   - When set to `true`, the SDK will automatically start recording session replays when the instance is initialized. The recording will
   be stopped and started automatically whenever the app goes to background and comes to foreground.
   For each new automatically started session, the SDK uses `recordingSessionsPercent`
   to determine whether recording should begin for that session.
  
   - When set to `false`, the SDK will not start recording until explicitly invoked by calling `startRecording()`.
  

#### 5. flushInterval
 Specifies the flush interval in seconds. The default is 10 seconds.
 Screenshots are collected and sent to Mixpanel in batches of 10.
 One batch is sent after each flush interval.
 You can adjust the flush interval to delay or expedite the sending of screenshots.

#### 6. enableLogging
 Enables debug-level logging for the SDK.
 - When set to `true`, the SDK will print verbose debug logs to the console to assist with development and troubleshooting.
   These logs may include internal events, configuration status, and lifecycle hooks relevant to session replay.### Methods
 - When set to `false`, logging is suppressed except for critical errors or warnings.
 - Default: `false`

#### `initialize(config: SessionReplayConfig): Promise<void>`
Initialize the session replay SDK with configuration.

#### `startRecording(): Promise<void>`
Manually starts session replay recording. If recording is already active, calling this method has no effect. 

The recording will continue until you manually stop it or until the app goes to the background, whichever happens first.

#### `stopRecording(): Promise<void>`
Stops the session recording and performs cleanup tasks.

#### `isRecording(): Promise<boolean>`
Check if recording is currently active.

#### `identify(distinctId: string): Promise<void>`
Sets the distinct ID to session replays. You can use this method to update the distinctId post the Session Replay SDK initialisation.
  It is recommanded to call Identify from Mixpanel main SDK first and then calling identify from the Session Replay SDK. This makes sure to properly merge the users.

## Privacy & Security
This SDK includes automatic masking of sensitive information. Text input fields are masked by default and cannot be disabled through the `autoMaskedViews` configuration.
Additional configurable masking options include:
- Images
- Text
- WebView content
- Apple map views (iOS only)


## Example App

Run the example app to test the integration:

```sh
# Install dependencies
yarn

# Start Metro
yarn example start

# Run on iOS
yarn example ios

# Run on Android  
yarn example android
```

## Requirements

- React Native >= 0.70
- iOS >= 13.0
- Android API Level >= 21
- New Architecture support

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
