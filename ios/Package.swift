// swift-tools-version: 5.9
//
// Swift Package Manager manifest for React Native's SPM autolinking (RN 0.88+).
//
// React Native's autolinker references this package through a symlink at
// <app>/ios/build/generated/autolinking/libs/MixpanelReactNativeSessionReplay and
// resolves the relative React paths below against that location, so this manifest
// only resolves inside an app that has run `npx react-native spm`. CocoaPods users
// keep using MixpanelReactNativeSessionReplay.podspec.
//
// SwiftPM cannot compile Swift and Objective-C++ in one target, so the native module
// is split in two: the Swift wrapper around the Session Replay iOS SDK, and the
// Objective-C++ TurboModule and view manager that call into it.

import PackageDescription

let reactNativeProducts: [Target.Dependency] = [
    .product(name: "ReactHeaders", package: "ReactNative"),
    .product(name: "ReactNativeHeaders", package: "ReactNative"),
    .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
    // Holds the codegen'd MixpanelReactNativeSessionReplaySpec headers.
    .product(name: "ReactAppHeaders", package: "React-GeneratedCode"),
]

let package = Package(
    name: "MixpanelReactNativeSessionReplay",
    platforms: [.iOS("15.0")],
    products: [
        .library(
            name: "MixpanelReactNativeSessionReplay",
            targets: ["MixpanelReactNativeSessionReplay", "MixpanelReactNativeSessionReplaySwift"]
        ),
    ],
    dependencies: [
        // Keep in step with the MixpanelSessionReplay version in MixpanelReactNativeSessionReplay.podspec.
        .package(url: "https://github.com/mixpanel/mixpanel-ios-session-replay-package.git", exact: "2.0.0"),
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
        .package(name: "React-GeneratedCode", path: "../../../ios"),
    ],
    targets: [
        .target(
            name: "MixpanelReactNativeSessionReplaySwift",
            dependencies: [
                .product(name: "MixpanelSessionReplay", package: "mixpanel-ios-session-replay-package"),
            ],
            path: "Sources/MixpanelReactNativeSessionReplaySwift"
        ),
        .target(
            name: "MixpanelReactNativeSessionReplay",
            dependencies: ["MixpanelReactNativeSessionReplaySwift"] + reactNativeProducts,
            path: "Sources/MixpanelReactNativeSessionReplay",
            publicHeadersPath: ".",
            cxxSettings: [
                // React Native 0.88 is New Architecture only; CocoaPods sets this through
                // install_modules_dependencies, which SwiftPM has no equivalent of.
                .define("RCT_NEW_ARCH_ENABLED", to: "1"),
                // Match the prebuilt React.framework's config-gated C++ ABI, as React
                // Native's own SwiftPM scaffolder does.
                .define("DEBUG", .when(configuration: .debug)),
                .define("NDEBUG", .when(configuration: .release)),
                // Objective-C++ needs C++ modules to `@import` the Swift target, whose
                // generated header Xcode only exposes as a Clang module.
                .unsafeFlags(["-fmodules", "-fcxx-modules"]),
            ],
            linkerSettings: [.linkedFramework("UIKit"), .linkedFramework("Foundation")]
        ),
    ],
    cxxLanguageStandard: .cxx20
)
