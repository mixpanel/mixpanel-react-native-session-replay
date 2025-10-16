#ifdef RCT_NEW_ARCH_ENABLED
#import <MixpanelReactNativeSessionReplaySpec/MixpanelReactNativeSessionReplaySpec.h>
#else
#import <React/RCTBridgeModule.h>
#endif

#ifdef RCT_NEW_ARCH_ENABLED
@interface MixpanelReactNativeSessionReplay : NSObject <NativeMixpanelReactNativeSessionReplaySpec>
#else
@interface MixpanelReactNativeSessionReplay : NSObject <RCTBridgeModule>
#endif

@end
