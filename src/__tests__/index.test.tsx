// Mock the native module
jest.mock('../NativeMixpanelReactNativeSessionReplay', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(() => Promise.resolve()),
    startRecording: jest.fn(() => Promise.resolve()),
    stopRecording: jest.fn(() => Promise.resolve()),
    isRecording: jest.fn(() => Promise.resolve(false)),
    identify: jest.fn(() => Promise.resolve()),
    getReplayId: jest.fn(() => Promise.resolve(null)),
  },
}));

import { MPSessionReplay } from '../index';

describe('MPSessionReplay', () => {
  it('should have getReplayId method', () => {
    expect(MPSessionReplay.getReplayId).toBeDefined();
    expect(typeof MPSessionReplay.getReplayId).toBe('function');
  });

  it('should have all expected methods', () => {
    expect(MPSessionReplay.initialize).toBeDefined();
    expect(MPSessionReplay.startRecording).toBeDefined();
    expect(MPSessionReplay.stopRecording).toBeDefined();
    expect(MPSessionReplay.isRecording).toBeDefined();
    expect(MPSessionReplay.identify).toBeDefined();
    expect(MPSessionReplay.getReplayId).toBeDefined();
  });
});
