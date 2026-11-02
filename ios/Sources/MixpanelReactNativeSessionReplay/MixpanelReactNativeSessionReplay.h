#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

// Subclasses `RCTEventEmitter` for the wireframe debug channel. That also supplies the
// `addListener:`/`removeListeners:` the TurboModule spec now declares, so the spec
// conformance (declared in the .mm, since the codegen'd spec headers are Objective-C++
// only) is satisfied without implementing them here.
@interface MixpanelReactNativeSessionReplay : RCTEventEmitter <RCTBridgeModule>

@end
