#import "MpSessionReplay.h"
#import "MpSessionReplay-Swift.h" // auto-imported Swift header

@implementation MpSessionReplay
RCT_EXPORT_MODULE()

- (void)startRecording {
  [SwiftMixpanelSessionReplay startRecording];
}

- (void)stopRecording {
  [SwiftMixpanelSessionReplay stopRecording];
}

- (void)captureScreenshot {
  [SwiftMixpanelSessionReplay captureScreenshot];
}

- (void)initialize:(NSString *)token distinctId:(NSString *)distinctId configJSON:(NSString *)json {
  [SwiftMixpanelSessionReplay initialize:token distinctId:distinctId configJSON:json];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeMpSessionReplaySpecJSI>(params);
}

@end
