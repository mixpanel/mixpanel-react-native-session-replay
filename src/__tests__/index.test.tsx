import {
  MPSessionReplay,
  MPSessionReplayConfig,
  MPSessionReplayMask,
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
  });

  it('should accept custom values', () => {
    const config = new MPSessionReplayConfig({
      wifiOnly: false,
      autoStartRecording: false,
      recordingSessionsPercent: 50,
      autoMaskedViews: [MPSessionReplayMask.Text],
      flushInterval: 20,
      enableLogging: true,
    });

    expect(config.wifiOnly).toBe(false);
    expect(config.autoStartRecording).toBe(false);
    expect(config.recordingSessionsPercent).toBe(50);
    expect(config.autoMaskedViews).toEqual([MPSessionReplayMask.Text]);
    expect(config.flushInterval).toBe(20);
    expect(config.enableLogging).toBe(true);
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
  });
});
