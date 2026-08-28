import {
  NativeEventEmitter,
  Platform,
  processColor,
  type ColorValue,
  type EmitterSubscription,
  type NativeModule,
} from 'react-native';
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
 * Base URLs for Mixpanel's managed data residency regions.
 *
 * Pass one of these constants to {@link MPSessionReplayConfig.serverURL} to route
 * session replay traffic to the matching region, or pass any other `https://` URL
 * to send traffic through a custom endpoint (for example, a corporate proxy).
 */
export const MPDataResidency: Readonly<Record<'US' | 'EU' | 'IN', string>> = {
  /** US data residency (default): `https://api.mixpanel.com`. */
  US: 'https://api.mixpanel.com',
  /** EU data residency: `https://api-eu.mixpanel.com`. */
  EU: 'https://api-eu.mixpanel.com',
  /** India data residency: `https://api-in.mixpanel.com`. */
  IN: 'https://api-in.mixpanel.com',
};

/**
 * Why a wireframe element's text was kept, rewritten, or dropped.
 *
 * Reported through {@link MPDebugOptions.wireframeEmitter} for local inspection only.
 * These are the same `SCREAMING_SNAKE_CASE` tokens Android, iOS and Flutter report, so
 * the same decision reads identically on every platform.
 *
 * ⚠️ **Not a stable contract.** Values may be added or renamed; treat an unrecognized
 * one as "some kind of masking" rather than matching exhaustively. That is also why
 * {@link MPWireframeElement.maskDecision} is typed `string` rather than a closed union —
 * a new native value should not become a type error.
 */
export const MPMaskDecision = {
  /** Text emitted as-is. */
  None: 'NONE',
  /** Text you declared with the `wireframeText` prop. Sent even when masked. */
  Declared: 'DECLARED',
  /** Explicitly masked — `<MPSessionReplayView sensitive>` or a registered class. */
  Explicit: 'EXPLICIT',
  /** Auto-masked by an `autoMaskedViews` category. */
  Auto: 'AUTO',
  /** A text-entry field. Always masked, cannot be overridden. */
  TextEntry: 'TEXT_ENTRY',
  /** Bounds intersected a mask rect the screenshot painted over. */
  Geometric: 'GEOMETRIC',
  /** Matched a strip rule; text was dropped. */
  RuleStrip: 'RULE_STRIP',
  /** Matched a redact rule; text was rewritten. */
  RuleRedact: 'RULE_REDACT',
} as const;

/** One element of a captured wireframe. See {@link MPWireframeSnapshot}. */
export interface MPWireframeElement {
  /** `text`, `button`, `input` or `image`. */
  role: string;
  /** The text this element ships with, or `null` for a textless shell. */
  text: string | null;
  /** `[x, y, width, height]`, in the same units the wireframe event carries. */
  bounds: number[];
  /** One of {@link MPMaskDecision}'s values — see the note there about matching. */
  maskDecision: string;
}

/**
 * One captured wireframe, exactly as the SDK built it.
 *
 * ⚠️ **Not a stable contract** — a debugging aid, not a schema to build tooling on.
 */
export interface MPWireframeSnapshot {
  /** Capture instant in milliseconds, matching the screenshot it accompanies. */
  timestamp: number;
  /** `[width, height]` of the captured viewport. */
  viewport: number[];
  elements: MPWireframeElement[];
}

/**
 * Native event carrying one wireframe snapshot as JSON.
 *
 * The payload crosses as a *string* rather than a structured map on purpose: both SDKs
 * already own a `toJson()` for their debug snapshot, so forwarding it verbatim keeps the
 * bridge from becoming a third place where the shape can drift.
 */
const WIREFRAME_EVENT = 'MixpanelSessionReplayWireframe';

let wireframeEventEmitter: NativeEventEmitter | null = null;

// The one live subscription, owned by `initialize`. Replaced on every initialize so a
// re-init cannot leave the previous config's callback attached.
let wireframeSubscription: EmitterSubscription | null = null;

function getWireframeEventEmitter(): NativeEventEmitter {
  if (wireframeEventEmitter === null) {
    // Constructed lazily: importing this module must not create an emitter for an app
    // that never listens. The module is passed on both platforms because a TurboModule
    // has to supply `addListener`/`removeListeners` itself.
    wireframeEventEmitter = new NativeEventEmitter(
      MixpanelReactNativeSessionReplay as unknown as NativeModule
    );
  }
  return wireframeEventEmitter;
}

/**
 * Color configuration for the on-device debug mask overlay.
 *
 * Each color accepts any React Native [`ColorValue`](https://reactnative.dev/docs/colors)
 * — for example `'red'`, `'#FF0000'`, `'rgba(255, 0, 0, 0.5)'`, or `0xFFFF0000`.
 * Setting any of `maskColor`, `autoMaskColor`, or `unmaskColor` to `null` hides that
 * category from the overlay.
 *
 * The overlay only renders in a debuggable build. That is enforced by the native SDKs
 * themselves, so it is safe to leave `overlayColors` set unconditionally.
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
 * `debugOptions` reaches the native SDK in every bundle, exactly as it would if you
 * configured it natively. Each feature decides for itself what a release build may do:
 * the overlay is restricted to debuggable builds by the native SDKs, while
 * {@link MPDebugOptions.wireframeEmitter} runs wherever you configure it.
 */
export class MPDebugOptions {
  /**
   * Color configuration for the debug mask overlay. When `null`, the overlay is disabled.
   *
   * - **Default:** `new MPDebugOverlayColors()` (overlay enabled with default colors)
   */
  overlayColors: MPDebugOverlayColors | null;

  /**
   * Hands each captured wireframe back to JavaScript as it is captured, so you can check
   * what you are sending while you develop.
   *
   * You get exactly the elements that go to Mixpanel, plus the reason each one's text was
   * kept or removed. Nothing delivered here leaves the device.
   *
   * This *observes* wireframe capture; it does not enable it. Wireframes are only captured
   * when {@link MPSessionReplayConfig.wireframesOptions} is set, so a callback on its own is
   * harmless but never fires.
   *
   * It runs in whichever bundle you configure it in, matching the native SDKs. Nothing it
   * delivers leaves the device, but building each snapshot is work the SDK otherwise skips
   * and every frame crosses the bridge — so leave it unset once you are done checking.
   *
   * Configuration only, and deliberately so: declaring the callback is what turns snapshot
   * building on, so there is no way to pay for the work with nothing listening. Set it before
   * {@link MPSessionReplay.initialize}, which is where the destination is attached — a later
   * `initialize` replaces it, and there is no runtime subscribe.
   *
   * Snapshots arrive on a background thread natively and are delivered one per frame, so a
   * slow callback queues work on the bridge. Keep it cheap.
   *
   * ```ts
   * config.debugOptions = new MPDebugOptions({
   *   wireframeEmitter: (frame) => {
   *     const withText = frame.elements.filter((e) => e.text !== null).length;
   *     console.log(`[wireframe] ${frame.elements.length} elements, ${withText} with text`);
   *   },
   * });
   * ```
   *
   * - **Default:** `null` (no snapshots are built)
   */
  wireframeEmitter: ((snapshot: MPWireframeSnapshot) => void) | null;

  constructor({
    overlayColors = new MPDebugOverlayColors(),
    wireframeEmitter = null,
  }: Partial<MPDebugOptions> = {}) {
    this.overlayColors = overlayColors;
    this.wireframeEmitter = wireframeEmitter;
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
  // No `__DEV__` gate: `debugOptions` is passed through in every bundle, the same as
  // configuring it natively. Each SDK decides for itself what a release build may do —
  // the overlay is restricted to debuggable builds by the native SDKs (`FLAG_DEBUGGABLE`
  // on Android, `#if DEBUG` on iOS, which holds because the pod ships source, not a
  // prebuilt binary) — so JavaScript does not need a second, differently-shaped opinion.
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
    // A real property of both SDKs' `DebugOptions`, decoded by their own config parsing — not
    // a key the bridges pick out of the raw JSON. Their `wireframeEmitter` is a callback and
    // cannot travel here, so each bridge attaches the destination when this is set.
    //
    // Derived rather than declared: a caller who wants snapshots supplies a callback, and the
    // flag follows from that. It is never possible to ask the SDKs to build snapshots that
    // nothing in JavaScript is waiting for.
    emitWireframes: debugOptions.wireframeEmitter !== null,
  };
}

/**
 * A rule that rewrites or drops the text of a wireframe element when it matches.
 *
 * Build rules with the {@link MPSensitiveRule} factories rather than by hand — the object
 * shape below is the wire format the native SDKs decode, not an API to write literals
 * against.
 *
 * Rules run in the order you list them in {@link MPWireframesOptions.sensitiveRules},
 * after the SDK's own masking, over whatever text is left — including text you declared
 * with the `wireframeText` prop on {@link MPSessionReplayView}. A matching strip rule
 * drops the text and stops immediately; a matching redact rule rewrites the text, and any
 * rule after it sees the rewritten value.
 */
export type MPSensitiveRule =
  | { type: 'redact'; text: string; replacement: string }
  | { type: 'strip'; text: string }
  | { type: 'redactRegex'; regex: RegExp; replacement: string }
  | { type: 'stripRegex'; regex: RegExp };

/** Replacement used by the redact rules when you do not supply one. */
export const MP_DEFAULT_REPLACEMENT = '[REDACTED]';

/**
 * Factories for the four {@link MPSensitiveRule} variants.
 *
 * ```ts
 * new MPWireframesOptions({
 *   sensitiveRules: [
 *     MPSensitiveRule.strip('password'),
 *     MPSensitiveRule.redactRegex(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[EMAIL]'),
 *   ],
 * });
 * ```
 */
export const MPSensitiveRule = {
  /**
   * Replaces case-insensitive substring matches of `text` with `replacement`, leaving the
   * surrounding text intact.
   */
  redact(
    text: string,
    replacement: string = MP_DEFAULT_REPLACEMENT
  ): MPSensitiveRule {
    return { type: 'redact', text, replacement };
  },

  /** Drops the element's text entirely if it contains `text` (case-insensitive). */
  strip(text: string): MPSensitiveRule {
    return { type: 'strip', text };
  },

  /**
   * Replaces matches of `regex` with `replacement`, leaving surrounding text intact.
   *
   * Only the `i`, `m` and `s` flags carry over to native; see
   * {@link MPWireframesOptions} for what the regex itself is subject to.
   */
  redactRegex(
    regex: RegExp,
    replacement: string = MP_DEFAULT_REPLACEMENT
  ): MPSensitiveRule {
    return { type: 'redactRegex', regex, replacement };
  },

  /** Drops the element's text entirely if `regex` finds a match anywhere in the text. */
  stripRegex(regex: RegExp): MPSensitiveRule {
    return { type: 'stripRegex', regex };
  },
};

/**
 * Enables wireframe capture for Session Replay.
 *
 * **Beta.** Wireframes are in beta. Before shipping to production, inspect the wireframes
 * your app produces with {@link MPDebugOptions.wireframeEmitter} and confirm that no
 * sensitive information is captured.
 *
 * A wireframe is a lightweight text outline of a screen: the visible elements, what kind
 * each one is (text, button, input, image), what it says, and where it sits. One is
 * captured alongside each screenshot, which lets Mixpanel summarize what your users saw
 * and did without anyone having to watch the replay.
 *
 * Pass one to {@link MPSessionReplayConfig.wireframesOptions} to turn wireframes on.
 * Leave it `null` — the default — and none are captured.
 *
 * Mixpanel can also turn wireframe capture off for a project from the server. The native
 * SDKs honor that switch: the rest of session replay keeps recording, only the wireframe
 * payload is dropped, and the reason is logged at init.
 *
 * ### Your masking settings are respected
 *
 * Anything hidden in the replay video is also removed from the wireframe. The element is
 * still listed so the shape of the screen is preserved, but its text is dropped. That
 * includes anything inside a `<MPSessionReplayView sensitive>`, anything covered by
 * {@link MPSessionReplayConfig.autoMaskedViews}, every `TextInput`, and anything sitting
 * underneath a masked area even if it was never marked sensitive itself.
 *
 * Note what this means for the defaults: `autoMaskedViews` masks `Text` out of the box, so
 * with the default configuration every element ships as a textless shell. Narrow
 * `autoMaskedViews` (and mask what matters with `<MPSessionReplayView sensitive>`) for
 * wireframes to carry readable copy.
 *
 * ### Describing an element yourself
 *
 * The `wireframeText` prop on {@link MPSessionReplayView} supplies the text for an element
 * — useful for custom-drawn content, or anywhere the text picked up automatically isn't
 * meaningful. Because you authored it rather than the SDK scraping it off the screen, it is
 * sent even for an element you've masked in the video.
 *
 * ### Catching sensitive content by pattern
 *
 * {@link sensitiveRules} match on the text itself and run last, over everything above,
 * including text you supplied with `wireframeText`.
 */
export class MPWireframesOptions {
  /**
   * Rules applied to each element's text before it is sent, in the order you declare them.
   * Elements are always kept; only their text is affected.
   *
   * - A matching strip rule drops the text and stops — no later rule runs.
   * - Redact rules build on one another: a rule declared later sees the result of the ones
   *   before it, not the original text.
   *
   * A `RegExp` is compiled by the platform's own engine — `java.util.regex` on Android,
   * ICU on iOS — not by JavaScript. A pattern that is valid JS may behave differently, or
   * be rejected outright, on one of them; a rejected pattern fails `initialize` rather
   * than silently matching nothing. Only the `i`, `m` and `s` flags cross the bridge (they
   * are the three that mean the same thing in all three engines); `g` is implied, since
   * every match is replaced, and any other flag is ignored with a warning. Replacement
   * strings are literal — `$1` is emitted verbatim, not as a back-reference.
   *
   * - **Default:** `[]`
   */
  sensitiveRules: MPSensitiveRule[];

  /**
   * Whether an element with no text of its own may fall back to its accessibility label
   * (React Native's `accessibilityLabel` prop). Off by default: a label is not drawn on
   * screen, so unlike visible text you cannot confirm what it contains by watching the
   * replay, and labels sometimes hold more than what is shown.
   *
   * Turn it on if you want icons and image buttons named. For an icon-only control the
   * label is usually the only description of what the element is for, and with the fallback
   * off it is sent as a bare shell instead — `wireframeText` is then the only way to
   * describe it.
   *
   * The label is only ever a fallback. Text you set with `wireframeText` wins over it, an
   * element's own visible text wins over it, and a masked element stays textless either way.
   *
   * - **Default:** `false`
   */
  useAccessibilityLabelFallback: boolean;

  constructor({
    sensitiveRules = [],
    useAccessibilityLabelFallback = false,
  }: Partial<MPWireframesOptions> = {}) {
    this.sensitiveRules = sensitiveRules;
    this.useAccessibilityLabelFallback = useAccessibilityLabelFallback;
  }
}

/**
 * Flags a `RegExp` carries that mean the same thing in JavaScript, `java.util.regex` and
 * ICU. `g` is deliberately accepted and dropped: the native rules always replace every
 * match, so a global regex is what a caller means either way.
 */
const SUPPORTED_REGEX_FLAGS = 'imsg';

function serializeRegex(regex: RegExp, ruleType: string): object {
  const unsupported = [...regex.flags].filter(
    (flag) => !SUPPORTED_REGEX_FLAGS.includes(flag)
  );
  if (unsupported.length > 0) {
    console.warn(
      `MixpanelSessionReplay: the ${unsupported.join('')} flag(s) on ${regex} (${ruleType}) are not supported by the native regex engines and will be ignored.`
    );
  }
  return {
    pattern: regex.source,
    caseInsensitive: regex.flags.includes('i'),
    multiline: regex.flags.includes('m'),
    dotMatchesAll: regex.flags.includes('s'),
  };
}

/**
 * The `wireframesOptions` payload, in the one shape both native SDKs decode.
 *
 * Unlike `autoMaskedViews` and `remoteSettingsMode`, this needs no per-platform
 * transformation: Android's `SensitiveRuleSerializer` and iOS's `MPSensitiveRule`
 * decoder were written against the same field names and `type` tokens, and each
 * platform's suite pins them as literal text.
 */
function serializeWireframesOptions(
  options: MPWireframesOptions | null
): object | null {
  if (options === null || options === undefined) {
    return null;
  }
  return {
    sensitiveRules: options.sensitiveRules.map((rule) => {
      switch (rule.type) {
        case 'redact':
          return {
            type: rule.type,
            text: rule.text,
            replacement: rule.replacement,
          };
        case 'strip':
          return { type: rule.type, text: rule.text };
        case 'redactRegex':
          return {
            type: rule.type,
            ...serializeRegex(rule.regex, rule.type),
            replacement: rule.replacement,
          };
        case 'stripRegex':
          return { type: rule.type, ...serializeRegex(rule.regex, rule.type) };
      }
    }),
    useAccessibilityLabelFallback: options.useAccessibilityLabelFallback,
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
   * The overlay only renders in a debuggable build — the native SDKs enforce that, so it
   * is safe to leave the option set unconditionally and the overlay will not reach end
   * users. {@link MPDebugOptions.wireframeEmitter}, the other member, has no such
   * restriction and runs wherever you configure it.
   *
   * - **Default:** `null` (disabled)
   */
  debugOptions: MPDebugOptions | null;

  /**
   * Base URL used to send session replay data to Mixpanel.
   *
   * Use one of the {@link MPDataResidency} constants to target a managed region
   * (`MPDataResidency.US`, `MPDataResidency.EU`, `MPDataResidency.IN`), or pass any
   * fully-qualified `https://` URL to route traffic through a custom endpoint such
   * as a corporate proxy.
   *
   * The URL must use `https://`. The underlying native SDKs validate the URL
   * during `initialize` — invalid URLs cause `initialize` to reject with an error
   * on both platforms.
   *
   * - **Default:** `MPDataResidency.US` (`https://api.mixpanel.com`)
   */
  serverURL: string;

  /**
   * Enables wireframe capture: a text outline of each captured screen — the visible
   * elements, what they say, and where they sit — recorded alongside the replay so
   * sessions can be summarized without watching them.
   *
   * Pass `new MPWireframesOptions()` to turn it on with the defaults, or customize the
   * content rules and the accessibility-label fallback. Your masking settings apply to
   * it; see {@link MPWireframesOptions}.
   *
   * **Beta.** Wireframes are in beta. Before shipping to production, inspect the wireframes
   * your app produces and confirm that no sensitive information is captured; see
   * {@link MPWireframesOptions}.
   *
   * - **Default:** `null` (wireframe capture disabled)
   */
  wireframesOptions: MPWireframesOptions | null;

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
    serverURL = MPDataResidency.US,
    wireframesOptions = null,
  }: Partial<MPSessionReplayConfig> = {}) {
    this.wifiOnly = wifiOnly;
    this.autoStartRecording = autoStartRecording;
    this.recordingSessionsPercent = recordingSessionsPercent;
    this.autoMaskedViews = autoMaskedViews;
    this.flushInterval = flushInterval;
    this.enableLogging = enableLogging;
    this.remoteSettingsMode = remoteSettingsMode;
    this.debugOptions = debugOptions;
    this.serverURL = serverURL;
    this.wireframesOptions = wireframesOptions;
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
      wireframesOptions: serializeWireframesOptions(this.wireframesOptions),
      // The native SDKs spell the server URL field differently — Android's
      // kotlinx.serialization expects `serverUrl`, iOS's Codable expects `serverURL`.
      ...Platform.select({
        ios: {
          enableSessionReplayOniOS26AndLater: true,
          serverURL: this.serverURL,
        },
        android: { serverUrl: this.serverURL },
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
  // Attached before the native call so no frame can be emitted before the destination
  // exists.
  attachWireframeEmitter(config.debugOptions?.wireframeEmitter);
  try {
    return await MixpanelReactNativeSessionReplay.initialize(
      token,
      distinctId,
      json
    );
  } catch (error) {
    attachWireframeEmitter(null);
    throw error;
  }
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

/**
 * Presents one shape to JavaScript regardless of which SDK produced the payload.
 *
 * A textless element is `"text": null` on both platforms now, but iOS used to *omit* the
 * key — Swift's synthesized `Encodable` uses `encodeIfPresent` for optionals — which
 * reached JS as `undefined` and printed as the string `"undefined"` in anything that only
 * checked for `null`. The SDK is fixed; this keeps the declared
 * `text: string | null` contract true against an older one too.
 */
function normalizeSnapshot(raw: MPWireframeSnapshot): MPWireframeSnapshot {
  return {
    ...raw,
    elements: (raw.elements ?? []).map((element) => ({
      ...element,
      text: element.text ?? null,
    })),
  };
}

/**
 * Points the native wireframe event at {@link MPDebugOptions.wireframeEmitter}, replacing
 * whatever a previous `initialize` attached.
 *
 * There is no public subscribe. The callback is declared on the config beside the switch that
 * turns wireframes on, which is how Android, iOS and Flutter spell it too, and it means the
 * one-callback lifetime is the instance's rather than something a caller has to remember to
 * tear down.
 */
function attachWireframeEmitter(
  listener: ((snapshot: MPWireframeSnapshot) => void) | null | undefined
): void {
  wireframeSubscription?.remove();
  wireframeSubscription = null;

  if (!listener) {
    return;
  }

  wireframeSubscription = getWireframeEventEmitter().addListener(
    WIREFRAME_EVENT,
    (payload: string) => {
      let snapshot: MPWireframeSnapshot;
      try {
        snapshot = normalizeSnapshot(JSON.parse(payload));
      } catch (error) {
        // The payload is whichever SDK's `toJson()` produced it. Report and drop the
        // frame rather than throwing out of the emitter callback, which would take the
        // subscription down with it.
        console.warn(
          `MixpanelSessionReplay: could not parse a wireframe snapshot: ${error}`
        );
        return;
      }
      listener(snapshot);
    }
  );
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
