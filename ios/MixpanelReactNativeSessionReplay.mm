#import "MixpanelReactNativeSessionReplay.h"
#if __has_include("MixpanelReactNativeSessionReplay-Swift.h")
  #import <MixpanelReactNativeSessionReplay-Swift.h>
#else
  #import <MixpanelReactNativeSessionReplay/MixpanelReactNativeSessionReplay-Swift.h>
#endif

@implementation MixpanelReactNativeSessionReplay
RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(initialize:(nonnull NSString *)token distinctId:(nonnull NSString *)distinctId configJSON:(nonnull NSString *)configJSON resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject)
{
    @try {
        if (!token || !distinctId) {
            reject(@"INVALID_CONFIG", @"Token and distinctId are required", nil);
            return;
        }
      [MixpanelSwiftSessionReplay initialize:token distinctId:distinctId configJSON:configJSON completion:^(BOOL success, NSError * _Nullable error) {
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

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeMixpanelReactNativeSessionReplaySpecJSI>(params);
}
#endif

@end
