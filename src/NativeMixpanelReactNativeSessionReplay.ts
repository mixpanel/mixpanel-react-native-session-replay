import type { TurboModule } from 'react-native';
import { NativeModules, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  initialize(
    token: string,
    distinctId: string,
    configJSON: string
  ): Promise<void>;
  startRecording(recordingSessionsPercent: number): Promise<void>;
  stopRecording(): Promise<void>;
  // Functionality not available in Android SDK ATM. It returns true always.
  isRecording(): Promise<boolean>;
  identify(distinctId: string): Promise<void>;
  getReplayId(): Promise<string | null>;
}

// Type declaration for global to include __turboModuleProxy
declare global {
  var __turboModuleProxy: unknown | undefined;
}

// Support both old and new architectures
// Try to use TurboModule (new architecture) first, fallback to NativeModules (old architecture)
const isTurboModuleEnabled = global.__turboModuleProxy != null;

let MixpanelReactNativeSessionReplay: Spec | null = null;

if (isTurboModuleEnabled) {
  // New architecture with TurboModule
  try {
    MixpanelReactNativeSessionReplay = TurboModuleRegistry.get<Spec>(
      'MixpanelReactNativeSessionReplay'
    );
  } catch (e) {
    // TurboModule not available, will fall back to NativeModules
    console.warn(
      'MixpanelReactNativeSessionReplay: TurboModule not available, falling back to NativeModules'
    );
  }
}

// Fallback to NativeModules for old architecture or if TurboModule fails
if (!MixpanelReactNativeSessionReplay) {
  MixpanelReactNativeSessionReplay =
    NativeModules.MixpanelReactNativeSessionReplay;
}

// If still not available, provide helpful error message
if (!MixpanelReactNativeSessionReplay) {
  const errorMessage =
    `The package '@mixpanel/react-native-session-replay' doesn't seem to be linked. Make sure:\n\n` +
    "- You have installed the package using 'yarn add @mixpanel/react-native-session-replay' or 'npm install @mixpanel/react-native-session-replay'.\n" +
    '- You have rebuilt the app after installing the package.\n' +
    "- For iOS: You have run 'pod install' in the 'ios' directory and opened the .xcworkspace file in Xcode.\n" +
    '- For Android: You have synced your project with Gradle files and rebuilt the app.\n' +
    '- If you are using Expo, this package is not compatible with Expo Go.\n';

  throw new Error(errorMessage);
}

export default MixpanelReactNativeSessionReplay as Spec;
