require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "mixpanel-react-native-session-replay"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = <<-DESC
                  #{package["description"]}
                   DESC
  s.homepage     = "https://github.com/mixpanel/mixpanel-react-native-session-replay"
  s.license      = "MIT"
  s.authors      = package["author"]

  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/mixpanel/mixpanel-react-native-session-replay.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}"
  s.public_header_files = "ios/**/*.h"

  # React Native Dependencies
  s.dependency "React-Core"
  s.dependency "React-NativeModulesApple" 
  s.dependency "ReactCodegen"
  s.dependency "RCTRequired"
  s.dependency "RCTTypeSafety"
  s.dependency "ReactCommon/turbomodule/bridging"
  s.dependency "ReactCommon/turbomodule/core"
  s.dependency "React-RCTFabric"
  s.dependency "React-Fabric"
  s.dependency "React-graphics"
  s.dependency "React-utils"
  s.dependency "React-featureflags"
  s.dependency "React-debug"
  s.dependency "React-ImageManager"
  s.dependency "React-rendererdebug"
  s.dependency "React-renderercss"
  s.dependency "React-jsi"
  s.dependency "React-hermes"

  # Third-party Dependencies  
  s.dependency "RCT-Folly", "2024.11.18.00"
  s.dependency "glog"
  s.dependency "DoubleConversion"
  s.dependency "Yoga"
  s.dependency "hermes-engine"

  # Mixpanel Dependencies
  s.dependency "Mixpanel"
  s.dependency "MixpanelSessionReplay"
  
  # Configure for New Architecture
  s.compiler_flags = "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32 -DRCT_NEW_ARCH_ENABLED=1"
  
  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
    "OTHER_CPLUSPLUSFLAGS" => "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
  }

  s.ios.deployment_target = "13.0"
end