#import "MixpanelReactNativeSessionReplay.h"
#if __has_include("MixpanelReactNativeSessionReplay-Swift.h")
  #import <MixpanelReactNativeSessionReplay-Swift.h>
#else
  #import <MixpanelReactNativeSessionReplay/MixpanelReactNativeSessionReplay-Swift.h>
#endif

@implementation MixpanelReactNativeSessionReplay
RCT_EXPORT_MODULE()

- (void)initialize:(nonnull NSString *)token distinctId:(nonnull NSString *)distinctId configJSON:(nonnull NSString *)configJSON resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
    @try {
        if (!token || !distinctId) {
            reject(@"INVALID_CONFIG", @"Token and distinctId are required", nil);
            return;
        }
      [MixpanelSwiftSessionReplay initialize:token distinctId:distinctId configJSON:configJSON completion:^(BOOL success, NSError * _Nullable error) {
        if (success) {
          resolve(nil);
        } else {
          reject(@"INITIALIZATION_FAILED", error.localizedDescription, error);
        }
      }];
    }
    @catch (NSException *exception) {
        reject(@"INITIALIZATION_ERROR", exception.reason, nil);
    }
}

- (void)startRecording:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject {
    @try {
        [MixpanelSwiftSessionReplay startRecording];
        resolve(nil);
    }
    @catch (NSException *exception) {
        reject(@"START_RECORDING_ERROR", exception.reason, nil);
    }
}

- (void)stopRecording:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject {
    @try {
        [MixpanelSwiftSessionReplay stopRecording];
        resolve(nil);
    }
    @catch (NSException *exception) {
        reject(@"STOP_RECORDING_ERROR", exception.reason, nil);
    }
}

- (void)isRecording:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
    @try {
        BOOL recording = [MixpanelSwiftSessionReplay isRecording];
        resolve(@(recording));
    }
    @catch (NSException *exception) {
        reject(@"IS_RECORDING_ERROR", exception.reason, nil);
    }
}

- (void)identify:(NSString *)distinctId
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject {
    @try {
        if (!distinctId) {
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

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeMixpanelReactNativeSessionReplaySpecJSI>(params);
}

@end
