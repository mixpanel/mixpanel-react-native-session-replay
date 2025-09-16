#import <UIKit/UIKit.h>
#import <React/RCTViewManager.h>
#import <React/RCTView.h>

#if __has_include("MixpanelReactNativeSessionReplay-Swift.h")
  #import <MixpanelReactNativeSessionReplay-Swift.h>
#else
  #import <MixpanelReactNativeSessionReplay/MixpanelReactNativeSessionReplay-Swift.h>
#endif

@interface MixpanelSessionReplayViewManager : RCTViewManager
@end

@implementation MixpanelSessionReplayViewManager

RCT_EXPORT_MODULE(MixpanelSessionReplayView)

- (UIView *)view
{
  return [[RCTView alloc] init];
}

RCT_CUSTOM_VIEW_PROPERTY(sensitive, BOOL, RCTView)
{
  if (json == nil) {
    return;
  }
  
  if ([json boolValue] == YES) {
     [MixpanelSwiftSessionReplay setMPReplaySensitiveWithValue:YES view:view];
  } else if ([json boolValue] == NO) {
    [MixpanelSwiftSessionReplay setMPReplaySensitiveWithValue:NO view:view];
  }
}

@end
