// The Objective-C interface of MixpanelSwiftSessionReplay (ios/Sources/
// MixpanelReactNativeSessionReplaySwift), for the Objective-C++ sources that call it.
//
// CocoaPods compiles the Swift and Objective-C++ sources into one module and generates
// MixpanelReactNativeSessionReplay-Swift.h, which is imported below. Under Swift Package
// Manager that generated header is only reachable as a Clang module, which would force
// React's headers into modules as well, so the interface is declared here instead.
//
// The declarations cover only what the Objective-C++ sources call, and must match the
// @objc API of MixpanelSwiftSessionReplay.swift: a mismatch still links under SwiftPM and
// fails at runtime with "unrecognized selector".

#if __has_include("MixpanelReactNativeSessionReplay-Swift.h")
  #import <MixpanelReactNativeSessionReplay-Swift.h>
#elif __has_include(<MixpanelReactNativeSessionReplay/MixpanelReactNativeSessionReplay-Swift.h>)
  #import <MixpanelReactNativeSessionReplay/MixpanelReactNativeSessionReplay-Swift.h>
#else
// Expected only under SwiftPM; under CocoaPods, reaching here means the generated header wasn't found.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface MixpanelSwiftSessionReplay : NSObject

+ (void)startRecordingWithRecordingSessionsPercent:(double)recordingSessionsPercent;
+ (void)stopRecording;
+ (void)initialize:(NSString *)token
          distinctId:(NSString *)distinctId
          configJSON:(NSString *)configJSON
    wireframeHandler:(void (^_Nullable)(NSString *))wireframeHandler
          completion:(void (^)(BOOL, NSError *_Nullable))completion;
+ (BOOL)isRecording;
+ (void)identify:(NSString *)distinctId;
+ (nullable NSString *)getReplayId;
+ (void)flushWithCompletionHandler:(void (^)(void))completionHandler;
+ (void)setMPReplaySensitiveWithValue:(BOOL)value view:(UIView *)view;
+ (void)setMPWireframeTextWithValue:(nullable NSString *)value view:(UIView *)view;

@end

NS_ASSUME_NONNULL_END

#endif
