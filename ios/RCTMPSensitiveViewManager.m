#import <React/RCTViewManager.h>
#import <React/RCTView.h>
#import "MpSessionReplay-Swift.h"

@interface RCTMPSensitiveViewManager : RCTViewManager
@end

@implementation RCTMPSensitiveViewManager

RCT_EXPORT_MODULE(RCTMPSensitiveView)

- (UIView *)view
{
  return [[RCTView alloc] init];
}

RCT_CUSTOM_VIEW_PROPERTY(mask, NSString, RCTView)
{
  NSString* mask = [RCTConvert NSString:json];
  if ([mask isEqualToString:@"sensitive"]) {
     [SwiftMixpanelSensitiveViewManager setMPReplaySensitiveWithValue:YES view:view];
  } else if ([mask isEqualToString:@"safe"]) {
    [SwiftMixpanelSensitiveViewManager setMPReplaySensitiveWithValue:NO view:view];
  }
}

@end
