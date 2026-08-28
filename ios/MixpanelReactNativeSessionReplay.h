#import <React/RCTEventEmitter.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <MixpanelReactNativeSessionReplaySpec/MixpanelReactNativeSessionReplaySpec.h>
#else
#import <React/RCTBridgeModule.h>
#endif

// Subclasses `RCTEventEmitter` for the wireframe debug channel. That also supplies the
// `addListener:`/`removeListeners:` the TurboModule spec now declares, so the protocol
// conformance below is satisfied without implementing them here.
#ifdef RCT_NEW_ARCH_ENABLED
@interface MixpanelReactNativeSessionReplay : RCTEventEmitter <NativeMixpanelReactNativeSessionReplaySpec>
#else
@interface MixpanelReactNativeSessionReplay : RCTEventEmitter <RCTBridgeModule>
#endif

@end
