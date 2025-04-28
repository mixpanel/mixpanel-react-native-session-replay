import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  startRecording(): void;
  stopRecording(): void;
  initialize(token: string, distinctId: string, configJSON: string): void;
  captureScreenshot(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('MpSessionReplay');
