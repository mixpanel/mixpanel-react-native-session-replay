#import <UIKit/UIKit.h>
#import <React/RCTViewManager.h>
#import <React/RCTView.h>

#if __has_include("MixpanelReactNativeSessionReplay-Swift.h")
  #import <MixpanelReactNativeSessionReplay-Swift.h>
#elif __has_include(<MixpanelReactNativeSessionReplay/MixpanelReactNativeSessionReplay-Swift.h>)
  #import <MixpanelReactNativeSessionReplay/MixpanelReactNativeSessionReplay-Swift.h>
#else
  // Swift Package Manager: the Swift target's generated header is only reachable as a
  // Clang module, which would pull React's headers into modules too, so the Swift class's
  // Objective-C interface is declared by hand instead.
  #import "MixpanelSwiftSessionReplay.h"
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

// Declares the text recorded for this view in the wireframe. Orthogonal to `sensitive`:
// declared text is authored by the developer, so it ships even for a masked view. `nil`
// clears the declaration, which is what a removed or emptied prop sends.
RCT_CUSTOM_VIEW_PROPERTY(wireframeText, NSString *, RCTView)
{
  NSString *text = [json isKindOfClass:[NSString class]] ? (NSString *)json : nil;
  [MixpanelSwiftSessionReplay setMPWireframeTextWithValue:text view:view];
}

@end
