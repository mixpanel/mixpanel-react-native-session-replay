import { Platform } from 'react-native';
import MixpanelReactNativeSessionReplay from './NativeMixpanelReactNativeSessionReplay';

export enum MPSessionReplayMask {
  Text = 'text',
  Web = 'web',
  Map = 'map',
  Image = 'image',
}

export class MPSessionReplayConfig {
  wifiOnly: boolean;
  recordingSessionsPercent: number;
  autoMaskedViews: MPSessionReplayMask[];
  autoStartRecording: boolean;
  flushInterval: number;
  enableLogging: boolean;

  constructor({
    wifiOnly = true,
    autoStartRecording = true,
    recordingSessionsPercent = 100,
    autoMaskedViews = [
      MPSessionReplayMask.Image,
      MPSessionReplayMask.Text,
      MPSessionReplayMask.Web,
      MPSessionReplayMask.Map,
    ],
    flushInterval = 10,
    enableLogging = false,
  }: Partial<MPSessionReplayConfig> = {}) {
    this.wifiOnly = wifiOnly;
    this.autoStartRecording = autoStartRecording;
    this.recordingSessionsPercent = recordingSessionsPercent;
    this.autoMaskedViews = autoMaskedViews;
    this.flushInterval = flushInterval;
    this.enableLogging = enableLogging;
  }

  private transformMaskValueForPlatform(value: string): string {
    if (Platform.OS === 'android') {
      // Android expects capitalized values: Text, Image, Web, Map
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    // iOS expects lowercase values: text, image, web, map
    return value;
  }

  toJSON(): string {
    // Transform autoMaskedViews for platform-specific requirements
    const transformedAutoMaskedViews = this.autoMaskedViews.map((mask) =>
      this.transformMaskValueForPlatform(mask)
    );

    const config = {
      wifiOnly: this.wifiOnly,
      recordingSessionsPercent: this.recordingSessionsPercent,
      autoMaskedViews: transformedAutoMaskedViews,
      autoStartRecording: this.autoStartRecording,
      flushInterval: this.flushInterval,
      enableLogging: this.enableLogging,
    };

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // console.log(Platform.OS, JSON.stringify(config));
      return JSON.stringify(config);
    } else {
      return '';
    }
  }
}

export { MixpanelSessionReplayView } from './MixpanelSessionReplayView';

export async function initialize(
  token: string,
  distinctId: string,
  config: MPSessionReplayConfig
): Promise<void> {
  if (!token || typeof token !== 'string') {
    throw new Error('Mixpanel token is required and must be a string');
  }
  if (!distinctId || typeof distinctId !== 'string') {
    throw new Error('distinctId is required and must be a string');
  }
  if (
    config.recordingSessionsPercent !== undefined &&
    (config.recordingSessionsPercent < 0 ||
      config.recordingSessionsPercent > 100)
  ) {
    throw new Error('recordingSessionsPercent must be between 0 and 100');
  }
  const json = config.toJSON();
  return MixpanelReactNativeSessionReplay.initialize(token, distinctId, json);
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
