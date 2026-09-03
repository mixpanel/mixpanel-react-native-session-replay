#import "MixpanelReactNativeSessionReplay.h"
#if __has_include("MixpanelReactNativeSessionReplay-Swift.h")
  #import <MixpanelReactNativeSessionReplay-Swift.h>
#else
  #import <MixpanelReactNativeSessionReplay/MixpanelReactNativeSessionReplay-Swift.h>
#endif

/// Must match `WIREFRAME_EVENT` in `src/index.tsx` and `WIREFRAME_EVENT` on Android.
static NSString *const kMixpanelWireframeEvent = @"MixpanelSessionReplayWireframe";

@implementation MixpanelReactNativeSessionReplay {
  // Set between `startObserving` and `stopObserving`. `sendEventWithName:` logs a warning
  // when nothing is listening, and wireframes fire once per captured frame, so an app that
  // enabled the emitter and then removed its listener would otherwise flood the console.
  BOOL _hasWireframeListeners;
}

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents
{
  return @[ kMixpanelWireframeEvent ];
}

- (void)startObserving
{
  _hasWireframeListeners = YES;
}

- (void)stopObserving
{
  _hasWireframeListeners = NO;
}

RCT_EXPORT_METHOD(initialize:(nonnull NSString *)token distinctId:(nonnull NSString *)distinctId configJSON:(nonnull NSString *)configJSON resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject)
{
    @try {
        if (!token || !distinctId) {
            reject(@"INVALID_CONFIG", @"Token and distinctId are required", nil);
            return;
        }
      // Weak, because the SDK holds this block for the process lifetime — the module must not
      // be kept alive by it, and after a reload there may be no module to deliver to.
      __weak MixpanelReactNativeSessionReplay *weakSelf = self;
      [MixpanelSwiftSessionReplay initialize:token distinctId:distinctId configJSON:configJSON wireframeHandler:^(NSString *snapshotJSON) {
        MixpanelReactNativeSessionReplay *strongSelf = weakSelf;
        if (strongSelf == nil || !strongSelf->_hasWireframeListeners) {
          return;
        }
        [strongSelf sendEventWithName:kMixpanelWireframeEvent body:snapshotJSON];
      } completion:^(BOOL success, NSError * _Nullable error) {
        if (success) {
          resolve(nil);
        } else {
          reject(@"INITIALIZATION_FAILED", error.debugDescription, error);
        }
      }];
    }
    @catch (NSException *exception) {
        reject(@"INITIALIZATION_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(startRecording:(double)recordingSessionsPercent
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject)
{
    @try {
      [MixpanelSwiftSessionReplay startRecordingWithRecordingSessionsPercent:recordingSessionsPercent];
        resolve(nil);
    }
    @catch (NSException *exception) {
        reject(@"START_RECORDING_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(stopRecording:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject)
{
    @try {
        [MixpanelSwiftSessionReplay stopRecording];
        resolve(nil);
    }
    @catch (NSException *exception) {
        reject(@"STOP_RECORDING_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(isRecording:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject)
{
    @try {
        BOOL recording = [MixpanelSwiftSessionReplay isRecording];
        resolve(@(recording));
    }
    @catch (NSException *exception) {
        reject(@"IS_RECORDING_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(identify:(NSString *)distinctId
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject)
{
    @try {
        if (!distinctId || [distinctId isEqualToString: @""]) {
            reject(@"INVALID_DISTINCT_ID", @"distinctId is required", nil);
            return;
        }

        [MixpanelSwiftSessionReplay identify:distinctId];
        resolve(nil);
    }
    @catch (NSException *exception) {
        reject(@"IDENTIFY_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(getReplayId:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSString *replayId = [MixpanelSwiftSessionReplay getReplayId];
        resolve(replayId);
    }
    @catch (NSException *exception) {
        reject(@"GET_REPLAY_ID_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(flush:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject)
{
    @try {
        [MixpanelSwiftSessionReplay flushWithCompletionHandler:^{
            resolve(nil);
        }];
    }
    @catch (NSException *exception) {
        reject(@"FLUSH_ERROR", exception.reason, nil);
    }
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeMixpanelReactNativeSessionReplaySpecJSI>(params);
}
#endif

@end
