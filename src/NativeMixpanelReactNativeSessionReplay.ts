import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

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
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'MixpanelReactNativeSessionReplay'
);
