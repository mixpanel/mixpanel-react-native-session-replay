import { NativeEventEmitter } from 'react-native';
import {
  MP_DEFAULT_REPLACEMENT,
  MPDataResidency,
  MPDebugOptions,
  MPDebugOverlayColors,
  MPMaskDecision,
  MPSensitiveRule,
  MPSessionReplay,
  MPSessionReplayConfig,
  MPSessionReplayMask,
  MPSessionReplayRemoteSettingsMode,
  MPWireframesOptions,
} from '../index';
import type { MPWireframeSnapshot } from '../index';

// Mock the native module
jest.mock('../NativeMixpanelReactNativeSessionReplay', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue(undefined),
    startRecording: jest.fn().mockResolvedValue(undefined),
    stopRecording: jest.fn().mockResolvedValue(undefined),
    isRecording: jest.fn().mockResolvedValue(false),
    identify: jest.fn().mockResolvedValue(undefined),
    getReplayId: jest.fn().mockResolvedValue(null),
    flush: jest.fn().mockResolvedValue(undefined),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));

// Get the mocked module for assertions
const MockedNativeModule = jest.requireMock(
  '../NativeMixpanelReactNativeSessionReplay'
).default;

describe('MPSessionReplay', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getReplayId()', () => {
    it('should call the native getReplayId method', async () => {
      await MPSessionReplay.getReplayId();
      expect(MockedNativeModule.getReplayId).toHaveBeenCalledTimes(1);
      expect(MockedNativeModule.getReplayId).toHaveBeenCalledWith();
    });

    it('should return the same value on consecutive calls', async () => {
      const mockReplayId = 'consistent-replay-id';
      MockedNativeModule.getReplayId.mockResolvedValue(mockReplayId);

      const result1 = await MPSessionReplay.getReplayId();
      const result2 = await MPSessionReplay.getReplayId();
      const result3 = await MPSessionReplay.getReplayId();

      expect(result1).toBe(mockReplayId);
      expect(result2).toBe(mockReplayId);
      expect(result3).toBe(mockReplayId);
      expect(MockedNativeModule.getReplayId).toHaveBeenCalledTimes(3);
    });
  });

  describe('initialize()', () => {
    it('should call native initialize with correct parameters', async () => {
      const token = 'test-token';
      const distinctId = 'user-123';
      const config = new MPSessionReplayConfig();

      await MPSessionReplay.initialize(token, distinctId, config);

      expect(MockedNativeModule.initialize).toHaveBeenCalledTimes(1);
      expect(MockedNativeModule.initialize).toHaveBeenCalledWith(
        token,
        distinctId,
        expect.any(String) // JSON string of config
      );
    });

    it('should throw error when token is missing', async () => {
      const config = new MPSessionReplayConfig();

      await expect(
        MPSessionReplay.initialize('', 'user-123', config)
      ).rejects.toThrow('Mixpanel token is required and must be a string');
    });

    it('should throw error when distinctId is missing', async () => {
      const config = new MPSessionReplayConfig();

      await expect(
        MPSessionReplay.initialize('test-token', '', config)
      ).rejects.toThrow('distinctId is required and must be a string');
    });
  });

  describe('identify()', () => {
    it('should call native identify with correct distinctId', async () => {
      const distinctId = 'new-user-456';

      await MPSessionReplay.identify(distinctId);

      expect(MockedNativeModule.identify).toHaveBeenCalledTimes(1);
      expect(MockedNativeModule.identify).toHaveBeenCalledWith(distinctId);
    });

    it('should throw error when distinctId is missing', async () => {
      await expect(MPSessionReplay.identify('')).rejects.toThrow(
        'distinctId is required and must be a string'
      );
    });

    it('should throw error when distinctId is not a string', async () => {
      await expect(MPSessionReplay.identify(null as any)).rejects.toThrow(
        'distinctId is required and must be a string'
      );

      await expect(MPSessionReplay.identify(123 as any)).rejects.toThrow(
        'distinctId is required and must be a string'
      );
    });
  });

  describe('startRecording()', () => {
    it('should call native startRecording with default percentage', async () => {
      await MPSessionReplay.startRecording();

      expect(MockedNativeModule.startRecording).toHaveBeenCalledTimes(1);
      expect(MockedNativeModule.startRecording).toHaveBeenCalledWith(100);
    });

    it('should call native startRecording with custom percentage', async () => {
      await MPSessionReplay.startRecording(50);

      expect(MockedNativeModule.startRecording).toHaveBeenCalledTimes(1);
      expect(MockedNativeModule.startRecording).toHaveBeenCalledWith(50);
    });
  });

  describe('stopRecording()', () => {
    it('should call native stopRecording', async () => {
      await MPSessionReplay.stopRecording();

      expect(MockedNativeModule.stopRecording).toHaveBeenCalledTimes(1);
      expect(MockedNativeModule.stopRecording).toHaveBeenCalledWith();
    });
  });

  describe('isRecording()', () => {
    it('should return false when not recording', async () => {
      MockedNativeModule.isRecording.mockResolvedValueOnce(false);
      const result = await MPSessionReplay.isRecording();

      expect(result).toBe(false);
      expect(MockedNativeModule.isRecording).toHaveBeenCalledTimes(1);
    });

    it('should return true when recording', async () => {
      MockedNativeModule.isRecording.mockResolvedValueOnce(true);
      const result = await MPSessionReplay.isRecording();

      expect(result).toBe(true);
      expect(MockedNativeModule.isRecording).toHaveBeenCalledTimes(1);
    });
  });

  describe('flush()', () => {
    it('should call native flush method', async () => {
      await MPSessionReplay.flush();

      expect(MockedNativeModule.flush).toHaveBeenCalledTimes(1);
      expect(MockedNativeModule.flush).toHaveBeenCalledWith();
    });

    it('should resolve successfully when flush completes', async () => {
      MockedNativeModule.flush.mockResolvedValueOnce(undefined);

      await expect(MPSessionReplay.flush()).resolves.toBeUndefined();
      expect(MockedNativeModule.flush).toHaveBeenCalledTimes(1);
    });
  });
});

describe('MPSessionReplayConfig', () => {
  it('should have default values', () => {
    const config = new MPSessionReplayConfig();

    expect(config.wifiOnly).toBe(true);
    expect(config.autoStartRecording).toBe(true);
    expect(config.recordingSessionsPercent).toBe(100);
    expect(config.autoMaskedViews).toEqual([
      MPSessionReplayMask.Image,
      MPSessionReplayMask.Text,
      MPSessionReplayMask.Web,
      MPSessionReplayMask.Map,
    ]);
    expect(config.flushInterval).toBe(10);
    expect(config.enableLogging).toBe(false);
    expect(config.remoteSettingsMode).toBe(
      MPSessionReplayRemoteSettingsMode.Disabled
    );
    expect(config.serverURL).toBe(MPDataResidency.US);
  });

  it('should accept custom values', () => {
    const config = new MPSessionReplayConfig({
      wifiOnly: false,
      autoStartRecording: false,
      recordingSessionsPercent: 50,
      autoMaskedViews: [MPSessionReplayMask.Text],
      flushInterval: 20,
      enableLogging: true,
      remoteSettingsMode: MPSessionReplayRemoteSettingsMode.Strict,
      serverURL: MPDataResidency.EU,
    });

    expect(config.wifiOnly).toBe(false);
    expect(config.autoStartRecording).toBe(false);
    expect(config.recordingSessionsPercent).toBe(50);
    expect(config.autoMaskedViews).toEqual([MPSessionReplayMask.Text]);
    expect(config.flushInterval).toBe(20);
    expect(config.enableLogging).toBe(true);
    expect(config.remoteSettingsMode).toBe(
      MPSessionReplayRemoteSettingsMode.Strict
    );
    expect(config.serverURL).toBe('https://api-eu.mixpanel.com');
  });

  it('should accept a custom serverURL string', () => {
    const config = new MPSessionReplayConfig({
      serverURL: 'https://mixpanel-proxy.test',
    });

    expect(config.serverURL).toBe('https://mixpanel-proxy.test');
  });

  it('should serialize to JSON string', () => {
    const config = new MPSessionReplayConfig();
    const json = config.toJSON();

    expect(typeof json).toBe('string');
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty('wifiOnly');
    expect(parsed).toHaveProperty('autoStartRecording');
    expect(parsed).toHaveProperty('recordingSessionsPercent');
    expect(parsed).toHaveProperty('autoMaskedViews');
    expect(parsed).toHaveProperty('flushInterval');
    expect(parsed).toHaveProperty('enableLogging');
    expect(parsed).toHaveProperty('remoteSettingsMode');
  });

  describe('platform-specific config', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should serialize remoteSettingsMode as uppercase for Android', () => {
      jest.doMock('react-native', () => ({
        Platform: {
          OS: 'android',
          select: (obj: any) => obj.android ?? obj.default,
        },
        requireNativeComponent: jest.fn(() => 'MockedNativeComponent'),
      }));

      const {
        MPSessionReplayConfig: AndroidConfig,
        MPSessionReplayRemoteSettingsMode: AndroidRemoteSettings,
      } = require('../index');

      let config = new AndroidConfig();
      let json = config.toJSON();
      let parsed = JSON.parse(json);
      expect(parsed.remoteSettingsMode).toBe('DISABLED');

      config = new AndroidConfig();
      config.remoteSettingsMode = AndroidRemoteSettings.Strict;
      json = config.toJSON();
      parsed = JSON.parse(json);
      expect(parsed.remoteSettingsMode).toBe('STRICT');

      config = new AndroidConfig();
      config.remoteSettingsMode = AndroidRemoteSettings.Fallback;
      json = config.toJSON();
      parsed = JSON.parse(json);
      expect(parsed.remoteSettingsMode).toBe('FALLBACK');
    });

    it('should serialize remoteSettingsMode as lowercase for iOS', () => {
      jest.doMock('react-native', () => ({
        Platform: {
          OS: 'ios',
          select: (obj: any) => obj.ios ?? obj.default,
        },
        requireNativeComponent: jest.fn(() => 'MockedNativeComponent'),
      }));

      const {
        MPSessionReplayConfig: IOSConfig,
        MPSessionReplayRemoteSettingsMode: IOSRemoteSettings,
      } = require('../index');

      let config = new IOSConfig();
      let json = config.toJSON();
      let parsed = JSON.parse(json);
      expect(parsed.remoteSettingsMode).toBe('disabled');

      config = new IOSConfig();
      config.remoteSettingsMode = IOSRemoteSettings.Strict;
      json = config.toJSON();
      parsed = JSON.parse(json);
      expect(parsed.remoteSettingsMode).toBe('strict');

      config = new IOSConfig();
      config.remoteSettingsMode = IOSRemoteSettings.Fallback;
      json = config.toJSON();
      parsed = JSON.parse(json);
      expect(parsed.remoteSettingsMode).toBe('fallback');
    });

    it('should include enableSessionReplayOniOS26AndLater for iOS', () => {
      jest.doMock('react-native', () => ({
        Platform: {
          OS: 'ios',
          select: (obj: any) => obj.ios ?? obj.default,
        },
        requireNativeComponent: jest.fn(() => 'MockedNativeComponent'),
      }));

      const { MPSessionReplayConfig: IOSConfig } = require('../index');
      const config = new IOSConfig();
      const json = config.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('enableSessionReplayOniOS26AndLater', true);
    });

    it('should NOT include enableSessionReplayOniOS26AndLater for Android', () => {
      jest.doMock('react-native', () => ({
        Platform: {
          OS: 'android',
          select: (obj: any) => obj.android ?? obj.default,
        },
        requireNativeComponent: jest.fn(() => 'MockedNativeComponent'),
      }));

      const { MPSessionReplayConfig: AndroidConfig } = require('../index');
      const config = new AndroidConfig();
      const json = config.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed).not.toHaveProperty('enableSessionReplayOniOS26AndLater');
    });

    it('should serialize serverURL as `serverUrl` for Android', () => {
      jest.doMock('react-native', () => ({
        Platform: {
          OS: 'android',
          select: (obj: any) => obj.android ?? obj.default,
        },
        requireNativeComponent: jest.fn(() => 'MockedNativeComponent'),
      }));

      const {
        MPSessionReplayConfig: AndroidConfig,
        MPDataResidency: AndroidDataResidency,
      } = require('../index');

      let config = new AndroidConfig();
      let parsed = JSON.parse(config.toJSON());
      expect(parsed.serverUrl).toBe('https://api.mixpanel.com');
      expect(parsed).not.toHaveProperty('serverURL');

      config = new AndroidConfig({ serverURL: AndroidDataResidency.EU });
      parsed = JSON.parse(config.toJSON());
      expect(parsed.serverUrl).toBe('https://api-eu.mixpanel.com');

      config = new AndroidConfig({ serverURL: 'https://mixpanel-proxy.test' });
      parsed = JSON.parse(config.toJSON());
      expect(parsed.serverUrl).toBe('https://mixpanel-proxy.test');
    });

    it('should serialize serverURL as `serverURL` for iOS', () => {
      jest.doMock('react-native', () => ({
        Platform: {
          OS: 'ios',
          select: (obj: any) => obj.ios ?? obj.default,
        },
        requireNativeComponent: jest.fn(() => 'MockedNativeComponent'),
      }));

      const {
        MPSessionReplayConfig: IOSConfig,
        MPDataResidency: IOSDataResidency,
      } = require('../index');

      let config = new IOSConfig();
      let parsed = JSON.parse(config.toJSON());
      expect(parsed.serverURL).toBe('https://api.mixpanel.com');
      expect(parsed).not.toHaveProperty('serverUrl');

      config = new IOSConfig({ serverURL: IOSDataResidency.IN });
      parsed = JSON.parse(config.toJSON());
      expect(parsed.serverURL).toBe('https://api-in.mixpanel.com');

      config = new IOSConfig({ serverURL: 'https://mixpanel-proxy.test' });
      parsed = JSON.parse(config.toJSON());
      expect(parsed.serverURL).toBe('https://mixpanel-proxy.test');
    });

    it('should return empty string for unsupported platforms', () => {
      jest.doMock('react-native', () => ({
        Platform: {
          OS: 'web',
          select: (obj: any) => obj.default,
        },
        requireNativeComponent: jest.fn(() => 'MockedNativeComponent'),
      }));

      const { MPSessionReplayConfig: WebConfig } = require('../index');
      const config = new WebConfig();
      const json = config.toJSON();

      expect(json).toBe('');
    });
  });

  describe('debugOptions serialization', () => {
    let warnSpy: jest.SpyInstance;
    const originalDev = (global as any).__DEV__;

    beforeEach(() => {
      (global as any).__DEV__ = true;
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      (global as any).__DEV__ = originalDev;
      warnSpy.mockRestore();
    });

    it('defaults debugOptions to null in serialized config', () => {
      const config = new MPSessionReplayConfig();
      const parsed = JSON.parse(config.toJSON());

      expect(config.debugOptions).toBeNull();
      expect(parsed.debugOptions).toBeNull();
    });

    it('serializes default MPDebugOptions to ARGB integers and default alpha', () => {
      const config = new MPSessionReplayConfig({
        debugOptions: new MPDebugOptions(),
      });
      const parsed = JSON.parse(config.toJSON());

      expect(parsed.debugOptions).not.toBeNull();
      expect(parsed.debugOptions.overlayColors.alpha).toBe(0.5);
      expect(typeof parsed.debugOptions.overlayColors.maskColor).toBe('number');
      expect(typeof parsed.debugOptions.overlayColors.autoMaskColor).toBe(
        'number'
      );
      expect(typeof parsed.debugOptions.overlayColors.unmaskColor).toBe(
        'number'
      );
    });

    it('preserves custom alpha and per-category nulls', () => {
      const config = new MPSessionReplayConfig({
        debugOptions: new MPDebugOptions({
          overlayColors: new MPDebugOverlayColors({
            maskColor: '#FF0000',
            autoMaskColor: null,
            unmaskColor: null,
            alpha: 0.25,
          }),
        }),
      });
      const parsed = JSON.parse(config.toJSON());

      expect(parsed.debugOptions.overlayColors.alpha).toBe(0.25);
      expect(typeof parsed.debugOptions.overlayColors.maskColor).toBe('number');
      expect(parsed.debugOptions.overlayColors.autoMaskColor).toBeNull();
      expect(parsed.debugOptions.overlayColors.unmaskColor).toBeNull();
    });

    it('serializes overlayColors as null when explicitly disabled', () => {
      const config = new MPSessionReplayConfig({
        debugOptions: new MPDebugOptions({ overlayColors: null }),
      });
      const parsed = JSON.parse(config.toJSON());

      expect(parsed.debugOptions).toEqual({
        overlayColors: null,
        emitWireframes: false,
      });
    });

    it('warns and serializes invalid colors as null', () => {
      const config = new MPSessionReplayConfig({
        debugOptions: new MPDebugOptions({
          overlayColors: new MPDebugOverlayColors({
            maskColor: 'not-a-real-color',
          }),
        }),
      });
      const parsed = JSON.parse(config.toJSON());

      expect(parsed.debugOptions.overlayColors.maskColor).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('not-a-real-color');
    });

    /**
     * There is no `__DEV__` gate. `debugOptions` crosses in every bundle, exactly as it
     * would if configured natively, and each feature decides for itself what a release
     * build may do — the overlay is restricted to debuggable builds by the native SDKs.
     * JavaScript holding a second, differently-shaped opinion is what this pins against.
     */
    it('passes debugOptions through regardless of the bundle', () => {
      (global as any).__DEV__ = false;

      const config = new MPSessionReplayConfig({
        debugOptions: new MPDebugOptions({ overlayColors: null }),
      });
      const parsed = JSON.parse(config.toJSON());

      expect(parsed.debugOptions).toEqual({
        overlayColors: null,
        emitWireframes: false,
      });
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('still serializes debugOptions as null when it is null', () => {
      const config = new MPSessionReplayConfig();
      const parsed = JSON.parse(config.toJSON());

      expect(parsed.debugOptions).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  /**
   * The `wireframesOptions` payload.
   *
   * Both native SDKs decode the *same* object — Android's `SensitiveRuleSerializer` and
   * iOS's `MPSensitiveRule` decoder were written against these field names and `type`
   * tokens, and each platform's suite pins them as literal text. That is why, unlike
   * `autoMaskedViews` and `remoteSettingsMode`, nothing here is transformed per platform.
   * Keep these assertions in step with `WireframesOptionsTest.kt` and
   * `MPWireframesOptionsCodableTests.swift`.
   */
  describe('wireframesOptions serialization', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('leaves wireframe capture off by default', () => {
      const config = new MPSessionReplayConfig();
      const parsed = JSON.parse(config.toJSON());

      expect(config.wireframesOptions).toBeNull();
      expect(parsed.wireframesOptions).toBeNull();
    });

    it('turns capture on with the defaults for a bare MPWireframesOptions', () => {
      const config = new MPSessionReplayConfig({
        wireframesOptions: new MPWireframesOptions(),
      });
      const parsed = JSON.parse(config.toJSON());

      expect(parsed.wireframesOptions).toEqual({
        sensitiveRules: [],
        useAccessibilityLabelFallback: false,
      });
    });

    it('serializes useAccessibilityLabelFallback', () => {
      const config = new MPSessionReplayConfig({
        wireframesOptions: new MPWireframesOptions({
          useAccessibilityLabelFallback: true,
        }),
      });
      const parsed = JSON.parse(config.toJSON());

      expect(parsed.wireframesOptions.useAccessibilityLabelFallback).toBe(true);
    });

    it('serializes every rule variant in the shape both SDKs decode', () => {
      const config = new MPSessionReplayConfig({
        wireframesOptions: new MPWireframesOptions({
          sensitiveRules: [
            MPSensitiveRule.strip('password'),
            MPSensitiveRule.redact('SSN', '[SSN]'),
            MPSensitiveRule.stripRegex(/\d{16}/),
            MPSensitiveRule.redactRegex(/[^@]+@[^@]+/, '[EMAIL]'),
          ],
        }),
      });
      const parsed = JSON.parse(config.toJSON());

      expect(parsed.wireframesOptions.sensitiveRules).toEqual([
        { type: 'strip', text: 'password' },
        { type: 'redact', text: 'SSN', replacement: '[SSN]' },
        {
          type: 'stripRegex',
          pattern: '\\d{16}',
          caseInsensitive: false,
          multiline: false,
          dotMatchesAll: false,
        },
        {
          type: 'redactRegex',
          pattern: '[^@]+@[^@]+',
          replacement: '[EMAIL]',
          caseInsensitive: false,
          multiline: false,
          dotMatchesAll: false,
        },
      ]);
    });

    it('defaults the redact replacement to the shared token', () => {
      const config = new MPSessionReplayConfig({
        wireframesOptions: new MPWireframesOptions({
          sensitiveRules: [
            MPSensitiveRule.redact('SSN'),
            MPSensitiveRule.redactRegex(/\d+/),
          ],
        }),
      });
      const parsed = JSON.parse(config.toJSON());

      // Both native SDKs fall back to the same literal when `replacement` is absent, so
      // this value has to agree with `SensitiveRule.DEFAULT_REPLACEMENT` (Android) and
      // `MPSensitiveRule.defaultReplacement` (iOS).
      expect(MP_DEFAULT_REPLACEMENT).toBe('[REDACTED]');
      expect(parsed.wireframesOptions.sensitiveRules[0].replacement).toBe(
        MP_DEFAULT_REPLACEMENT
      );
      expect(parsed.wireframesOptions.sensitiveRules[1].replacement).toBe(
        MP_DEFAULT_REPLACEMENT
      );
    });

    it('maps the i, m and s regex flags across the bridge', () => {
      const config = new MPSessionReplayConfig({
        wireframesOptions: new MPWireframesOptions({
          sensitiveRules: [MPSensitiveRule.stripRegex(/a.b/ims)],
        }),
      });
      const parsed = JSON.parse(config.toJSON());

      expect(parsed.wireframesOptions.sensitiveRules[0]).toEqual({
        type: 'stripRegex',
        pattern: 'a.b',
        caseInsensitive: true,
        multiline: true,
        dotMatchesAll: true,
      });
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('accepts the g flag silently — native always replaces every match', () => {
      const config = new MPSessionReplayConfig({
        wireframesOptions: new MPWireframesOptions({
          sensitiveRules: [MPSensitiveRule.redactRegex(/a/g)],
        }),
      });
      JSON.parse(config.toJSON());

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('warns about flags the native engines do not share, and still sends the pattern', () => {
      const config = new MPSessionReplayConfig({
        wireframesOptions: new MPWireframesOptions({
          sensitiveRules: [MPSensitiveRule.stripRegex(/a/u)],
        }),
      });
      const parsed = JSON.parse(config.toJSON());

      expect(parsed.wireframesOptions.sensitiveRules[0].pattern).toBe('a');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('u');
    });

    it('preserves rule order — a strip short-circuits the rules after it', () => {
      const config = new MPSessionReplayConfig({
        wireframesOptions: new MPWireframesOptions({
          sensitiveRules: [
            MPSensitiveRule.redact('a'),
            MPSensitiveRule.strip('b'),
            MPSensitiveRule.redact('c'),
          ],
        }),
      });
      const parsed = JSON.parse(config.toJSON());

      expect(
        parsed.wireframesOptions.sensitiveRules.map((rule: any) => rule.text)
      ).toEqual(['a', 'b', 'c']);
    });

    it('sends the identical payload on both platforms', () => {
      const build = (platform: 'ios' | 'android') => {
        jest.resetModules();
        jest.doMock('react-native', () => ({
          Platform: {
            OS: platform,
            select: (obj: any) => obj[platform] ?? obj.default,
          },
          processColor: jest.fn(() => 0),
          requireNativeComponent: jest.fn(() => 'MockedNativeComponent'),
        }));
        const mod = require('../index');
        const config = new mod.MPSessionReplayConfig({
          wireframesOptions: new mod.MPWireframesOptions({
            sensitiveRules: [
              mod.MPSensitiveRule.strip('password'),
              mod.MPSensitiveRule.redactRegex(/\d+/i, '[N]'),
            ],
            useAccessibilityLabelFallback: true,
          }),
        });
        return JSON.parse(config.toJSON()).wireframesOptions;
      };

      // `autoMaskedViews` and `remoteSettingsMode` need per-platform casing; this one
      // deliberately does not, so a divergence here is a bug rather than a convention.
      expect(build('ios')).toEqual(build('android'));
    });
  });

  /**
   * The wireframe debug channel.
   *
   * This is the only way to see what a wireframe *says* from React Native: the SDK's own
   * log is deliberately content-free (element text is customer data), and
   * `DebugOptions.wireframeEmitter` is a native callback that cannot cross as JSON. So the
   * config carries an `emitWireframes` flag for each bridge to read — the SDKs themselves do
   * not model it — each bridge installs its own forwarder, and this module attaches the
   * JavaScript destination at `initialize`.
   *
   * The flag is derived from the callback rather than declared, and there is no runtime
   * subscribe — the callback's lifetime is the instance's, matching Android, iOS and Flutter.
   */
  describe('wireframe debug emitter', () => {
    const originalDev = (global as any).__DEV__;
    let warnSpy: jest.SpyInstance;

    /** Initializes with `listener` as the config's emitter — the only way to subscribe. */
    const listen = async (
      listener: ((snapshot: MPWireframeSnapshot) => void) | null
    ) => {
      await MPSessionReplay.initialize(
        'test-token',
        'user-123',
        new MPSessionReplayConfig({
          wireframesOptions: new MPWireframesOptions(),
          debugOptions: new MPDebugOptions({ wireframeEmitter: listener }),
        })
      );
    };

    beforeEach(() => {
      (global as any).__DEV__ = true;
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(async () => {
      // Every `NativeEventEmitter` over the same native module shares one subscription
      // registry, so a callback left attached would still receive the next test's payloads
      // and double its call counts. Re-initializing without one is the teardown.
      await listen(null);
      (global as any).__DEV__ = originalDev;
      warnSpy.mockRestore();
    });

    it('defaults wireframeEmitter to off', () => {
      expect(new MPDebugOptions().wireframeEmitter).toBeNull();

      const parsed = JSON.parse(
        new MPSessionReplayConfig({
          debugOptions: new MPDebugOptions(),
        }).toJSON()
      );
      expect(parsed.debugOptions.emitWireframes).toBe(false);
    });

    /**
     * The flag is a real property of both SDKs' `DebugOptions`, decoded by their own config
     * parsing. An earlier version smuggled it past that model and had each bridge pick it out of
     * the raw JSON string, which is why this asserts the serialized shape rather than just the
     * round trip.
     *
     * Deriving it from the callback is what makes "build snapshots nobody is listening for"
     * unrepresentable: the work is paid for only when there is somewhere to deliver it.
     */
    it('derives emitWireframes from the callback for the bridges to read', () => {
      const parsed = JSON.parse(
        new MPSessionReplayConfig({
          debugOptions: new MPDebugOptions({
            overlayColors: null,
            wireframeEmitter: () => {},
          }),
        }).toJSON()
      );

      expect(parsed.debugOptions).toEqual({
        overlayColors: null,
        emitWireframes: true,
      });
    });

    it('delivers in a production bundle too, like the native SDKs', async () => {
      (global as any).__DEV__ = false;
      const listener = jest.fn();
      await listen(listener);

      emitNativeSnapshot(
        JSON.stringify({ timestamp: 1, viewport: [1, 1], elements: [] })
      );

      expect(listener).toHaveBeenCalledTimes(1);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    /** Configuration only: no runtime subscribe, and no runtime setter. */
    it('exposes no runtime way in or out', () => {
      const surface = MPSessionReplay as Record<string, unknown>;
      expect(surface.addWireframeListener).toBeUndefined();
      expect(surface.setWireframeDebugEnabled).toBeUndefined();
      expect(MockedNativeModule.setWireframeDebugEnabled).toBeUndefined();
    });

    it('parses a snapshot and hands it to the callback', async () => {
      const listener = jest.fn();
      await listen(listener);

      const snapshot = {
        timestamp: 1717171717171,
        viewport: [393, 852],
        elements: [
          {
            role: 'text',
            text: 'Order total',
            bounds: [16, 100, 200, 24],
            maskDecision: 'NONE',
          },
          {
            role: 'input',
            text: null,
            bounds: [16, 140, 200, 44],
            maskDecision: 'TEXT_ENTRY',
          },
        ],
      };
      emitNativeSnapshot(JSON.stringify(snapshot));

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(snapshot);
    });

    it('replaces the callback on the next initialize', async () => {
      const first = jest.fn();
      const second = jest.fn();
      await listen(first);
      await listen(second);

      emitNativeSnapshot(
        JSON.stringify({ timestamp: 1, viewport: [1, 1], elements: [] })
      );

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });

    it('detaches when initialized without a callback', async () => {
      const listener = jest.fn();
      await listen(listener);

      emitNativeSnapshot(
        JSON.stringify({ timestamp: 1, viewport: [1, 1], elements: [] })
      );
      expect(listener).toHaveBeenCalledTimes(1);

      await listen(null);
      emitNativeSnapshot(
        JSON.stringify({ timestamp: 2, viewport: [1, 1], elements: [] })
      );
      expect(listener).toHaveBeenCalledTimes(1);
    });

    /**
     * The destination is attached before the native call so no frame can arrive without one.
     * A failed initialize has to undo that, or the callback outlives the config that declared
     * it and fires for whatever initializes next.
     */
    it('detaches when initialization fails', async () => {
      const listener = jest.fn();
      MockedNativeModule.initialize.mockRejectedValueOnce(
        new Error('init failed')
      );

      await expect(listen(listener)).rejects.toThrow('init failed');

      emitNativeSnapshot(
        JSON.stringify({ timestamp: 1, viewport: [1, 1], elements: [] })
      );
      expect(listener).not.toHaveBeenCalled();
    });

    /**
     * `initialize` is async and nothing stops an app calling it twice. The destination is
     * attached before the native call, so a call that rejects must not tear down a
     * subscription a later, successful call already installed.
     */
    it('a failed initialize does not detach a newer callback', async () => {
      const slowLoser = jest.fn();
      const winner = jest.fn();

      // A first initialize that rejects, but only after the second has settled.
      let rejectFirst: (reason: Error) => void = () => {};
      MockedNativeModule.initialize.mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectFirst = reject;
          })
      );

      const first = listen(slowLoser);
      await listen(winner);
      rejectFirst(new Error('init failed'));
      await expect(first).rejects.toThrow('init failed');

      emitNativeSnapshot(
        JSON.stringify({ timestamp: 1, viewport: [1, 1], elements: [] })
      );

      expect(winner).toHaveBeenCalledTimes(1);
      expect(slowLoser).not.toHaveBeenCalled();
    });

    /**
     * The mirror of the case above: the *newer* call fails first, so it tears down its
     * own subscription — having already replaced the older call's. The older call then
     * succeeds and must end up owning the destination rather than none existing at all.
     */
    it('an older initialize that succeeds last still owns the callback', async () => {
      const older = jest.fn();
      const newer = jest.fn();

      let resolveOlder: () => void = () => {};
      MockedNativeModule.initialize.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveOlder = resolve;
          })
      );
      MockedNativeModule.initialize.mockImplementationOnce(() =>
        Promise.reject(new Error('newer failed'))
      );

      const olderCall = listen(older);
      await expect(listen(newer)).rejects.toThrow('newer failed');
      resolveOlder();
      await olderCall;

      emitNativeSnapshot(
        JSON.stringify({ timestamp: 1, viewport: [1, 1], elements: [] })
      );

      expect(older).toHaveBeenCalledTimes(1);
      expect(newer).not.toHaveBeenCalled();
    });

    it('normalizes a missing text key to null', async () => {
      const listener = jest.fn();
      await listen(listener);

      // iOS omitted the key for a textless element until the SDK was fixed, and a
      // consumer checking only for `null` then printed the string "undefined". The
      // declared contract is `text: string | null`, so the bridge holds it either way.
      emitNativeSnapshot(
        JSON.stringify({
          timestamp: 1,
          viewport: [393, 852],
          elements: [
            { role: 'image', bounds: [16, 141, 40, 40], maskDecision: 'NONE' },
          ],
        })
      );

      expect(listener.mock.calls[0][0].elements[0]).toEqual({
        role: 'image',
        text: null,
        bounds: [16, 141, 40, 40],
        maskDecision: 'NONE',
      });
    });

    it('warns and drops a malformed payload instead of throwing', async () => {
      const listener = jest.fn();
      await listen(listener);

      // A throw here would propagate through the emitter and take the subscription down
      // with it, so the frame is dropped instead.
      expect(() => emitNativeSnapshot('{ not json')).not.toThrow();
      expect(listener).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('wireframe snapshot');
    });

    it('exposes the mask decisions the native SDKs report', () => {
      // Same SCREAMING_SNAKE tokens Android, iOS and Flutter print, so a snapshot read
      // here is comparable with the other platforms' debug output and the goldens.
      expect(Object.values(MPMaskDecision)).toEqual([
        'NONE',
        'DECLARED',
        'EXPLICIT',
        'AUTO',
        'TEXT_ENTRY',
        'GEOMETRIC',
        'RULE_STRIP',
        'RULE_REDACT',
      ]);
    });
  });
});

/**
 * Fires the native event the wireframe bridge listens on.
 *
 * The module builds its own `NativeEventEmitter`, so the test drives the event through a
 * second emitter over the same (mocked) native module — which is how `NativeEventEmitter`
 * instances share a subscription registry.
 */
function emitNativeSnapshot(payload: string) {
  new NativeEventEmitter(MockedNativeModule).emit(
    'MixpanelSessionReplayWireframe',
    payload
  );
}
