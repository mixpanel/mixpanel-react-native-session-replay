import MpSessionReplay from './NativeMpSessionReplay';
export { MixpanelMaskView } from './MPMaskView';

export enum MPAutoMaskedViewsConfig {
  Image = 'Image',
  Text = 'Text',
  Web = 'Web',
}

export class MPSessionReplayConfig {
  wifiOnly: boolean;
  recordSessionsPercent: number;
  autoMaskedViews: MPAutoMaskedViewsConfig[];

  constructor({
    wifiOnly = true,
    recordSessionsPercent = 0,
    autoMaskedViews = [
      MPAutoMaskedViewsConfig.Image,
      MPAutoMaskedViewsConfig.Text,
      MPAutoMaskedViewsConfig.Web,
    ],
  }: Partial<MPSessionReplayConfig> = {}) {
    this.wifiOnly = wifiOnly;
    this.recordSessionsPercent = recordSessionsPercent;
    this.autoMaskedViews = autoMaskedViews;
  }

  toJSON(): string {
    return JSON.stringify({
      wifiOnly: this.wifiOnly,
      recordSessionsPercent: this.recordSessionsPercent,
      autoMaskedViews: this.autoMaskedViews,
      autoCapture: "enabled"
    });
  }
}

export function startRecording() {
  MpSessionReplay.startRecording();
}

export function stopRecording() {
  MpSessionReplay.stopRecording();
}

export function captureScreenshot() {
  MpSessionReplay.captureScreenshot();
}

export function initialize(
  token: string,
  distinctId: string,
  config: MPSessionReplayConfig
): void {
  var jsonConfig = config.toJSON();
  MpSessionReplay.initialize(token, distinctId, jsonConfig);
}