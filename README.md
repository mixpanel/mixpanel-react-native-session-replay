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

```sh
npm install mixpanel-react-native-session-replay
```

### iOS Setup

Add the following to your `ios/Podfile`:

```ruby
pod 'Mixpanel-swift', '~> 4.3'
pod 'MixpanelSessionReplay', '~> 1.0'
```

Then run:

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
  type SessionReplayConfig 
} from 'mixpanel-react-native-session-replay';

// Initialize session replay
const config: SessionReplayConfig = {
  token: 'YOUR_MIXPANEL_PROJECT_TOKEN',
  distinctId: 'user-123',
  wifiOnly: false,
  autoStartRecording: true,
  recordingSessionsPercent: 100,
  enableLogging: true,
};

await initialize(config);

// Control recording
await startRecording();
await stopRecording();

// Check recording status
const recording = await isRecording();
```

## API Reference

### Configuration

```typescript
interface SessionReplayConfig {
  token: string;                      // Mixpanel project token (required)
  distinctId: string;                 // User identifier (required)
  wifiOnly?: boolean;                 // Only transmit on WiFi (default: true)
  autoStartRecording?: boolean;       // Auto-start recording (default: true)
  recordingSessionsPercent?: number;  // Sampling rate 0-100 (default: 100)
  enableLogging?: boolean;           // Enable debug logging (default: false)
}
```

### Methods

#### `initialize(config: SessionReplayConfig): Promise<void>`
Initialize the session replay SDK with configuration.

#### `startRecording(): Promise<void>`
Start recording user interactions.

#### `stopRecording(): Promise<void>`
Stop recording user interactions.

#### `isRecording(): Promise<boolean>`
Check if recording is currently active.

#### `identify(distinctId: string): Promise<void>`
Update the user identifier for recordings.

## Privacy & Security

This SDK automatically masks sensitive information:
- Text input fields
- Images and media
- WebView content

Additional privacy controls are available through the native SDK configuration.

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
- iOS >= 12.0
- Android API Level >= 21
- New Architecture support

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
