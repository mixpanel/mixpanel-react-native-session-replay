#import "MixpanelReactNativeSessionReplay.h"
#import <Mixpanel/Mixpanel.h>
#import <MixpanelSessionReplay/MixpanelSessionReplay.h>

@implementation MixpanelReactNativeSessionReplay
RCT_EXPORT_MODULE()

- (void)initialize:(NSDictionary *)config
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
    @try {
        NSString *token = config[@"token"];
        NSString *distinctId = config[@"distinctId"];
        
        if (!token || !distinctId) {
            reject(@"INVALID_CONFIG", @"Token and distinctId are required", nil);
            return;
        }
        
        // Configure Mixpanel Session Replay
        MPSessionReplayConfig *replayConfig = [[MPSessionReplayConfig alloc] init];
        
        if (config[@"wifiOnly"]) {
            replayConfig.wifiOnly = [config[@"wifiOnly"] boolValue];
        }
        
        if (config[@"recordingSessionsPercent"]) {
            replayConfig.recordingSessionsPercent = [config[@"recordingSessionsPercent"] doubleValue];
        }
        
        if (config[@"enableLogging"]) {
            replayConfig.enableLogging = [config[@"enableLogging"] boolValue];
        }
        
        // Initialize Mixpanel Session Replay
        [MPSessionReplay initializeWithToken:token distinctId:distinctId config:replayConfig];
        
        resolve(nil);
    }
    @catch (NSException *exception) {
        reject(@"INITIALIZATION_ERROR", exception.reason, nil);
    }
}

- (void)startRecording:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject {
    @try {
        [MPSessionReplay startRecording];
        resolve(nil);
    }
    @catch (NSException *exception) {
        reject(@"START_RECORDING_ERROR", exception.reason, nil);
    }
}

- (void)stopRecording:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject {
    @try {
        [MPSessionReplay stopRecording];
        resolve(nil);
    }
    @catch (NSException *exception) {
        reject(@"STOP_RECORDING_ERROR", exception.reason, nil);
    }
}

- (void)isRecording:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
    @try {
        BOOL recording = [MPSessionReplay isRecording];
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
        
        [MPSessionReplay identify:distinctId];
        resolve(nil);
    }
    @catch (NSException *exception) {
        reject(@"IDENTIFY_ERROR", exception.reason, nil);
    }
}

- (void)markViewChildrenAsSafe:(double)viewTag
                       resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject {
    @try {
        UIView *parentView = [self.bridge.uiManager viewForReactTag:@((NSInteger)viewTag)];
        
        if ([parentView isKindOfClass:[MixpanelSessionReplayView class]]) {
            // Only process if it's actually our component type
            MixpanelSessionReplayView *mixpanelView = (MixpanelSessionReplayView *)parentView;
            [mixpanelView markOnlyDirectChildrenAsSafe];
            resolve(nil);
        } else {
            reject(@"INVALID_VIEW_TYPE", @"View is not a MixpanelSessionReplayView", nil);
        }
    }
    @catch (NSException *exception) {
        reject(@"MARK_CHILDREN_SAFE_ERROR", exception.reason, nil);
    }
}


- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeMixpanelReactNativeSessionReplaySpecJSI>(params);
}

@end
