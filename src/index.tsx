import MixpanelReactNativeSessionReplay, {
  type SessionReplayConfig,
} from './NativeMixpanelReactNativeSessionReplay';

export type { SessionReplayConfig };
export {
  MixpanelSessionReplayView,
  type MixpanelSessionReplayViewProps,
} from './MixpanelSessionReplayView';

export async function initialize(config: SessionReplayConfig): Promise<void> {
  if (!config.token || typeof config.token !== 'string') {
    throw new Error('Mixpanel token is required and must be a string');
  }
  if (!config.distinctId || typeof config.distinctId !== 'string') {
    throw new Error('distinctId is required and must be a string');
  }
  if (
    config.recordingSessionsPercent !== undefined &&
    (config.recordingSessionsPercent < 0 ||
      config.recordingSessionsPercent > 100)
  ) {
    throw new Error('recordingSessionsPercent must be between 0 and 100');
  }

  return MixpanelReactNativeSessionReplay.initialize(config);
}

export async function startRecording(): Promise<void> {
  return MixpanelReactNativeSessionReplay.startRecording();
}

export async function stopRecording(): Promise<void> {
  return MixpanelReactNativeSessionReplay.stopRecording();
}

export async function isRecording(): Promise<boolean> {
  return MixpanelReactNativeSessionReplay.isRecording();
}

export async function identify(distinctId: string): Promise<void> {
  if (!distinctId || typeof distinctId !== 'string') {
    throw new Error('distinctId is required and must be a string');
  }

  return MixpanelReactNativeSessionReplay.identify(distinctId);
}
