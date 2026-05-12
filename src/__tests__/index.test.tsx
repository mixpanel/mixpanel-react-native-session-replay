import {
  MPDebugOptions,
  MPDebugOverlayColors,
  MPSessionReplay,
  MPSessionReplayConfig,
  MPSessionReplayMask,
  MPSessionReplayRemoteSettingsMode,
} from '../index';

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

      expect(parsed.debugOptions).toEqual({ overlayColors: null });
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

    it('drops debugOptions and warns when __DEV__ is false', () => {
      (global as any).__DEV__ = false;

      const config = new MPSessionReplayConfig({
        debugOptions: new MPDebugOptions(),
      });
      const parsed = JSON.parse(config.toJSON());

      expect(parsed.debugOptions).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('production');
    });

    it('does not warn in production when debugOptions is null', () => {
      (global as any).__DEV__ = false;

      const config = new MPSessionReplayConfig();
      const parsed = JSON.parse(config.toJSON());

      expect(parsed.debugOptions).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('does not warn in production when overlayColors is null', () => {
      (global as any).__DEV__ = false;

      const config = new MPSessionReplayConfig({
        debugOptions: new MPDebugOptions({ overlayColors: null }),
      });
      const parsed = JSON.parse(config.toJSON());

      expect(parsed.debugOptions).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
