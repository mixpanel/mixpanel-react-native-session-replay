import { Platform, processColor, type ColorValue } from 'react-native';
import MixpanelReactNativeSessionReplay from './NativeMixpanelReactNativeSessionReplay';

export enum MPSessionReplayMask {
  Text = 'text',
  Web = 'web',
  Map = 'map',
  Image = 'image',
}

export enum MPSessionReplayRemoteSettingsMode {
  Disabled = 'disabled',
  Strict = 'strict',
  Fallback = 'fallback',
}

/**
 * Color configuration for the on-device debug mask overlay.
 *
 * Each color accepts any React Native [`ColorValue`](https://reactnative.dev/docs/colors)
 * — for example `'red'`, `'#FF0000'`, `'rgba(255, 0, 0, 0.5)'`, or `0xFFFF0000`.
 * Setting any of `maskColor`, `autoMaskColor`, or `unmaskColor` to `null` hides that
 * category from the overlay.
 *
 * The overlay only renders when `__DEV__` is `true` — `debugOptions` is ignored in
 * production bundles regardless of what is passed.
 */
export class MPDebugOverlayColors {
  /**
   * Color used to draw regions that are explicitly masked (sensitive views / text input).
   * Set to `null` to hide masked regions from the overlay.
   *
   * - **Default:** `'red'`
   */
  maskColor: ColorValue | null;

  /**
   * Color used to draw regions that are auto-masked (text, images, web views, maps).
   * Set to `null` to hide auto-masked regions from the overlay.
   *
   * - **Default:** `'orange'`
   */
  autoMaskColor: ColorValue | null;

  /**
   * Color used to draw regions explicitly excluded from masking (safe views).
   * Set to `null` to hide unmask regions from the overlay.
   *
   * - **Default:** `'green'`
   */
  unmaskColor: ColorValue | null;

  /**
   * Opacity of the overlay, from `0.0` (fully transparent) to `1.0` (fully opaque).
   *
   * - **Default:** `0.5`
   */
  alpha: number;

  constructor({
    maskColor = 'red',
    autoMaskColor = 'orange',
    unmaskColor = 'green',
    alpha = 0.5,
  }: Partial<MPDebugOverlayColors> = {}) {
    this.maskColor = maskColor;
    this.autoMaskColor = autoMaskColor;
    this.unmaskColor = unmaskColor;
    this.alpha = alpha;
  }
}

/**
 * Configuration for Session Replay debug features.
 *
 * When `overlayColors` is non-null, the SDK renders a visual overlay on top of the app
 * showing which regions are masked, auto-masked, or explicitly unmasked. Set
 * `overlayColors` to `null` to disable the overlay while keeping `MPDebugOptions`
 * available for future debug features.
 *
 * Debug features only render when `__DEV__` is `true`. In production bundles
 * (`__DEV__ === false`), `debugOptions` is dropped before reaching the native SDK so
 * the overlay never ships to end users.
 */
export class MPDebugOptions {
  /**
   * Color configuration for the debug mask overlay. When `null`, the overlay is disabled.
   *
   * - **Default:** `new MPDebugOverlayColors()` (overlay enabled with default colors)
   */
  overlayColors: MPDebugOverlayColors | null;

  constructor({
    overlayColors = new MPDebugOverlayColors(),
  }: Partial<MPDebugOptions> = {}) {
    this.overlayColors = overlayColors;
  }
}

function processOverlayColor(color: ColorValue | null): number | null {
  if (color === null || color === undefined) {
    return null;
  }
  // `processColor` returns the ARGB integer in the form expected by each native platform:
  // a signed 32-bit Int on Android (kotlinx.serialization Int) and an unsigned 32-bit
  // value on iOS (Swift Int is 64-bit, so it decodes without overflow). Invalid color
  // strings yield `undefined` — treat those the same as `null` (hide the category).
  const processed = processColor(color);
  if (typeof processed !== 'number') {
    console.warn(
      `MixpanelSessionReplay: invalid debug overlay color ${JSON.stringify(color)} — that category will be hidden from the overlay.`
    );
    return null;
  }
  return processed;
}

function serializeDebugOptions(
  debugOptions: MPDebugOptions | null
): object | null {
  if (debugOptions === null) {
    return null;
  }
  // Hard-gate debug features on `__DEV__` so they are never sent to native in
  // production bundles. The Android SDK already restricts the overlay to debuggable
  // builds, but the iOS SDK ships as a release XCFramework and would otherwise
  // render the overlay in production if a customer forgot to gate the call site.
  if (!__DEV__) {
    if (debugOptions.overlayColors !== null) {
      console.warn(
        'MixpanelSessionReplay: `debugOptions` is ignored in production builds (__DEV__ is false).'
      );
    }
    return null;
  }
  const overlayColors = debugOptions.overlayColors;
  return {
    overlayColors:
      overlayColors === null
        ? null
        : {
            maskColor: processOverlayColor(overlayColors.maskColor),
            autoMaskColor: processOverlayColor(overlayColors.autoMaskColor),
            unmaskColor: processOverlayColor(overlayColors.unmaskColor),
            alpha: overlayColors.alpha,
          },
  };
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
   * This value (between 0.0 and 100.0) defines the percentage of sessions that will automatically start recording
   * when a new session begins.
   *
   * - At `0.0`, no sessions will be auto-recorded.
   * - At `100.0`, all sessions will be auto-recorded.
   * - This setting is not used when invoking `startRecording()` manually.
   * - **Default:** `100`
   */
  recordingSessionsPercent: number;

  /**
   * Returns the set of views that are automatically masked by the SDK.
   *
   * By default, image, text, web, and map (MKMapView only for iOS) views are masked.
   * This default behavior can be overridden using this configuration.
   */
  autoMaskedViews: MPSessionReplayMask[];

  /**
   * Determines whether or not the SDK will automatically start recording session replays upon initialization.
   *
   * - When set to `true`, the SDK will automatically start recording session replays when the instance is initialized.
   *   The recording will be stopped and started automatically whenever the app goes to background and comes to foreground.
   *   For each new automatically started session, the SDK uses `recordingSessionsPercent` to determine whether recording
   *   should begin for that session.
   * - When set to `false`, the SDK will not start recording until explicitly invoked by calling `startRecording()`.
   */
  autoStartRecording: boolean;

  /**
   * Specifies the flush interval in seconds.
   *
   * Screenshots are collected and sent to Mixpanel in batches of 10.
   * One batch is sent after each flush interval.
   * You can adjust the flush interval to delay or expedite the sending of screenshots.
   *
   * - **Default:** `10` seconds
   */
  flushInterval: number;

  /**
   * Enables debug-level logging for the SDK.
   *
   * - When set to `true`, the SDK will print verbose debug logs to the console to assist with development and troubleshooting.
   *   These logs may include internal events, configuration status, and lifecycle hooks relevant to session replay.
   * - When set to `false`, logging is suppressed except for critical errors or warnings.
   * - **Default:** `false`
   */
  enableLogging: boolean;

  /**
   * Controls how remote configuration settings are fetched and applied.
   *
   * Remote settings enable server-side control over session replay parameters such as sampling rate.
   * This setting determines the SDK's behavior when fetching these settings and how failures are handled.
   *
   * - **`disabled`** (default): Remote config is fetched to check if session replay is enabled, but SDK config
   *   settings from the server are not used. The SDK uses only the app-provided configuration.
   * - **`strict`**: Remote config is required. If the fetch fails or times out, the SDK will not initialize.
   * - **`fallback`**: Remote config is fetched and merged with local config. On fetch failure, the SDK falls back
   *   to cached config (if available) or uses the local config.
   *
   * - **Default:** `disabled`
   */
  remoteSettingsMode: MPSessionReplayRemoteSettingsMode;

  /**
   * Enables on-device debug features such as the visual mask overlay.
   *
   * When non-null, the SDK renders a colored overlay on top of the app showing which
   * regions are masked, auto-masked, or explicitly unmasked — useful for verifying
   * masking coverage during development. Pass `new MPDebugOptions()` to enable the
   * overlay with default colors, or customize via `MPDebugOverlayColors`.
   *
   * `debugOptions` is only honored when `__DEV__` is `true`. In production bundles
   * it is dropped before reaching the native SDK, so it is safe to leave the option
   * set unconditionally — the overlay will not render for end users.
   *
   * - **Default:** `null` (disabled)
   */
  debugOptions: MPDebugOptions | null;

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
    remoteSettingsMode = MPSessionReplayRemoteSettingsMode.Disabled,
    debugOptions = null,
  }: Partial<MPSessionReplayConfig> = {}) {
    this.wifiOnly = wifiOnly;
    this.autoStartRecording = autoStartRecording;
    this.recordingSessionsPercent = recordingSessionsPercent;
    this.autoMaskedViews = autoMaskedViews;
    this.flushInterval = flushInterval;
    this.enableLogging = enableLogging;
    this.remoteSettingsMode = remoteSettingsMode;
    this.debugOptions = debugOptions;
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
    const transformedRemoteSettingsMode =
      Platform.OS === 'android'
        ? this.remoteSettingsMode.toUpperCase()
        : this.remoteSettingsMode;

    const config = {
      wifiOnly: this.wifiOnly,
      recordingSessionsPercent: this.recordingSessionsPercent,
      autoMaskedViews: transformedAutoMaskedViews,
      autoStartRecording: this.autoStartRecording,
      flushInterval: this.flushInterval,
      enableLogging: this.enableLogging,
      remoteSettingsMode: transformedRemoteSettingsMode,
      debugOptions: serializeDebugOptions(this.debugOptions),
      // iOS-specific config to enable session replay on iOS 26 and later
      ...Platform.select({
        ios: { enableSessionReplayOniOS26AndLater: true },
        default: {},
      }),
    };

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // console.log(Platform.OS, JSON.stringify(config));
      return JSON.stringify(config);
    } else {
      return '';
    }
  }
}

/**
 * Initializes the Mixpanel Session Replay system with the provided configuration.
 *
 * It checks remote configuration to determine if session recording is enabled, and only then initializes the SDK.
 * If the SDK is initialized previously, then it will be deinitialized first.
 *
 * @param token - The Mixpanel project token used to identify the project.
 * @param distinctId - A unique identifier for the current user.
 * @param config - The configuration object used to customize session replay behavior.
 * @throws An error if the token or distinctId is missing or invalid, or if the configuration is invalid,
 *   or if the initialization fails.
 */
async function initialize(
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
 * If recording is already active, calling this method has no effect.
 * The recording will continue until you manually stop it or until the app goes to the background, whichever happens first.
 *
 * @param recordingSessionsPercent - A value from 0 to 100 representing the likelihood that the current session will be recorded.
 *   This controls sampling of sessions. The `recordingSessionsPercent` value from the config is ignored when calling this method.
 * @default 100 (record all sessions)
 */
async function startRecording(
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
async function stopRecording(): Promise<void> {
  return MixpanelReactNativeSessionReplay.stopRecording();
}

/**
 * Tells you if the recording is in-progress.
 *
 * @returns A promise that resolves to `true` if recording is active, `false` otherwise.
 */
async function isRecording(): Promise<boolean> {
  return MixpanelReactNativeSessionReplay.isRecording();
}

/**
 * Sets the distinct ID for session replays.
 *
 * You can use this method to update the distinctId after the Session Replay SDK initialization.
 * It is recommended to call Identify from the Mixpanel main SDK first and then call identify from the Session Replay SDK.
 * This ensures that users are properly merged.
 *
 * @param distinctId - The distinct ID of the user.
 * @throws An error if the distinctId is missing or invalid.
 */
async function identify(distinctId: string): Promise<void> {
  if (!distinctId || typeof distinctId !== 'string') {
    throw new Error('distinctId is required and must be a string');
  }

  return MixpanelReactNativeSessionReplay.identify(distinctId);
}

/**
 * Gets the current replay ID.
 *
 * Returns the unique identifier for the current replay session, or null if no replay is active.
 * This ID can be used to correlate session replays with other analytics data.
 *
 * @returns A promise that resolves to the replay ID string or null if no replay is active.
 */
async function getReplayId(): Promise<string | null> {
  return MixpanelReactNativeSessionReplay.getReplayId();
}

/**
 * Manually triggers a flush of pending session replay events.
 *
 * This method forces the SDK to immediately upload all pending Session Replay events to Mixpanel,
 * bypassing the normal flush interval. The returned promise resolves when the flush operation completes.
 *
 * @returns A promise that resolves when the flush operation has completed.
 */
async function flush(): Promise<void> {
  return MixpanelReactNativeSessionReplay.flush();
}

export { MPSessionReplayView } from './MixpanelSessionReplayView';

export const MPSessionReplay = {
  initialize,
  startRecording,
  stopRecording,
  isRecording,
  identify,
  getReplayId,
  flush,
};
