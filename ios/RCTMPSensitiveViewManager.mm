#import <React/RCTViewManager.h>
#import <React/RCTView.h>

#if __has_include("MixpanelReactNativeSessionReplay-Swift.h")
  #import <MixpanelReactNativeSessionReplay-Swift.h>
#else
  #import <MixpanelReactNativeSessionReplay/MixpanelReactNativeSessionReplay-Swift.h>
#endif

@interface RCTMPSensitiveViewManager : RCTViewManager
@end

@implementation RCTMPSensitiveViewManager

RCT_EXPORT_MODULE(MixpanelSessionReplayView)

- (UIView *)view
{
  return [[RCTView alloc] init];
}

RCT_CUSTOM_VIEW_PROPERTY(mask, NSString, RCTView)
{
  NSString* mask = [RCTConvert NSString:json];
  if ([mask isEqualToString:@"sensitive"]) {
     [MixpanelSwiftSensitiveViewManager setMPReplaySensitiveWithValue:YES view:view];
  } else if ([mask isEqualToString:@"safe"]) {
    [MixpanelSwiftSensitiveViewManager setMPReplaySensitiveWithValue:NO view:view];
  }
}

@end
