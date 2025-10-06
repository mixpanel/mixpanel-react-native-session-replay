import { Platform } from 'react-native';
import MixpanelReactNativeSessionReplay from './NativeMixpanelReactNativeSessionReplay';

export enum MPSessionReplayMask {
  Text = 'text',
  Web = 'web',
  Map = 'map',
  Image = 'image',
}

export class MPSessionReplayConfig {
  /**
   * Determines whether replay events will only be flushed to the server when the device has a WiFi connection.
   *
   * - When set to `true`, replay events will only be flushed when the device is connected to WiFi.
   *   If no WiFi is available, flushes are skipped and the events remain in memory — they will be lost if the app is terminated before WiFi becomes available.
   * - When set to `false`, replay events will be flushed over any network connection, including cellular.
   * - **Default:** `true`
   */
  wifiOnly: boolean;

  /**
   * Controls the sampling rate for automatically started recording session replays.
   *
   * This value (between 0.0 and 100.0) defines the percentage of sessions that will automatically start recording when a new session begins.
   *
   * - At 0.0, no sessions will be auto-recorded.
   * - At 100.0, all sessions will be auto-recorded.
   * - Default: 100
   * - This setting is not used when invoking `startRecording()` manually.
   */
  recordingSessionsPercent: number;

  /**
   * Returns the set of views that are automatically masked by the SDK.
   * By default, image, text, web, and map(MKMapView only for iOS) views are masked.
   * This default behavior can be overridden using this configuration.
   */
  autoMaskedViews: MPSessionReplayMask[];

  /**
   * Determines whether or not the SDK will automatically start recording session replays upon initialization.
   *
   * - When set to `true`, the SDK will automatically start recording session replays when the instance is initialized. The recording will
   * be stopped and started automatically whenever the app goes to background and comes to foreground.
   * For each new automatically started session, the SDK uses `recordingSessionsPercent`
   * to determine whether recording should begin for that session.
   *
   * - When set to `false`, the SDK will not start recording until explicitly invoked by calling `startRecording()`.
   */
  autoStartRecording: boolean;

  /**
   * Specifies the flush interval in seconds. The default is 10 seconds.
   * Screenshots are collected and sent to Mixpanel in batches of 10.
   *
   * One batch is sent after each flush interval.
   * You can adjust the flush interval to delay or expedite the sending of screenshots.
   */
  flushInterval: number;

  /**
   * Enables debug-level logging for the SDK.
   *
   * - When set to `true`, the SDK will print verbose debug logs to the console to assist with development and troubleshooting.
   *   These logs may include internal events, configuration status, and lifecycle hooks relevant to session replay.
   *
   * - When set to `false`, logging is suppressed except for critical errors or warnings.
   * - Default: `false`
   */
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
    const transformedAutoMaskedViews = this.autoMaskedViews
      .filter(
        (mask) =>
          !(Platform.OS === 'android' && mask === MPSessionReplayMask.Map)
      )
      .map((mask) => this.transformMaskValueForPlatform(mask));

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

/**
 * Initializes the Mixpanel Session Replay system with the provided configuration.
 *
 * It checks remote configuration to determine if session recording is enabled, and only then
 * initializes SDK. If the SDK is initialized previously, then it will be deinitialized first.
 *
 * @param token - The Mixpanel project token used to identify the project.
 * @param distinctId - A unique identifier for the current user.
 * @param config - The configuration object used to customize session replay behavior.
 * @throws An error if the token or distinctId is missing or invalid, or if the configuration is invalid, or if the initialization fails.
 */
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

/**
 * Manually starts session replay recording.
 *
 * @param sessionsPercent - A value from 0 to 100 representing the likelihood that the current session will be recorded.
 *   This controls sampling of sessions. Defaults to 100 (record all sessions) if not specified.
 *   The `recordingSessionsPercent` value from the config is ignored when calling this method.
 *
 *   If recording is already active, calling this method has no effect.
 *   The recording will continue until you manually stop it or until the app goes to the background, whichever happens first.
 */
export async function startRecording(
  recordingSessionsPercent: number = 100
): Promise<void> {
  return MixpanelReactNativeSessionReplay.startRecording(
    recordingSessionsPercent
  );
}

/**
 * Stops the session recording and performs cleanup tasks.
 *
 * This method stops recording, clears relevant session state, and uploads pending events.
 */
export async function stopRecording(): Promise<void> {
  return MixpanelReactNativeSessionReplay.stopRecording();
}

/**
 * Tells you if the recording is in-progress
 */
export async function isRecording(): Promise<boolean> {
  return MixpanelReactNativeSessionReplay.isRecording();
}

/**
 * Sets the distinct ID to session replays. You can use this method to update the distinctId post the Session Replay SDK initialization.
 * It is recommended to call Identify from Mixpanel main SDK first and then calling identify from the Session Replay SDK.
 * This makes sure to properly merge the users.
 * @param distinctId - distinctId of the user.
 */
export async function identify(distinctId: string): Promise<void> {
  if (!distinctId || typeof distinctId !== 'string') {
    throw new Error('distinctId is required and must be a string');
  }

  return MixpanelReactNativeSessionReplay.identify(distinctId);
}
