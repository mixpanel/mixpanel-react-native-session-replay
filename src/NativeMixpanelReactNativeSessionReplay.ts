import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface SessionReplayConfig {
  token: string;
  distinctId: string;
  wifiOnly?: boolean;
  autoStartRecording?: boolean;
  recordingSessionsPercent?: number;
  enableLogging?: boolean;
}

export interface Spec extends TurboModule {
  initialize(config: SessionReplayConfig): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  isRecording(): Promise<boolean>;
  identify(distinctId: string): Promise<void>;
  markViewChildrenAsSafe(viewTag: number): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'MixpanelReactNativeSessionReplay'
);
