// The Objective-C interface of MixpanelSwiftSessionReplay (ios/Sources/
// MixpanelReactNativeSessionReplaySwift), for Swift Package Manager builds only.
//
// CocoaPods compiles the Swift and Objective-C++ sources into one module and imports the
// generated MixpanelReactNativeSessionReplay-Swift.h instead. Under SwiftPM that generated
// header is only reachable as a Clang module, which would force React's headers into
// modules as well, so the interface is declared here. Keep it in step with the @objc API
// of MixpanelSwiftSessionReplay.swift.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface MixpanelSwiftSessionReplay : NSObject

+ (void)startRecordingWithRecordingSessionsPercent:(double)recordingSessionsPercent;
+ (void)stopRecording;
+ (void)captureScreenshot;
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
