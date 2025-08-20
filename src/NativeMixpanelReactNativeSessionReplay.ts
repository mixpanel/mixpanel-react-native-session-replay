import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  initialize(token: string, distinctId: string, configJSON: string): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  isRecording(): Promise<boolean>;
  identify(distinctId: string): Promise<void>;
  markViewChildrenAsSafe(viewTag: number): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'MixpanelReactNativeSessionReplay'
);
