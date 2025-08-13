#import <React/RCTViewManager.h>
#import "MixpanelSessionReplayView.h"

@interface MixpanelSessionReplayViewManager : RCTViewManager
@end

@implementation MixpanelSessionReplayViewManager

RCT_EXPORT_MODULE(MixpanelSessionReplayView)

RCT_EXPORT_VIEW_PROPERTY(sensitive, BOOL)

- (UIView *)view {
    return [[MixpanelSessionReplayView alloc] init];
}

@end