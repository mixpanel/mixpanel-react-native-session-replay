import MixpanelSessionReplay

@objc public class SwiftMixpanelSensitiveViewManager: NSObject {
  @objc public static func setMPReplaySensitive(value: Bool, view: UIView) {
    // Your Swift logic here
    view.mpReplaySensitive = value
  }
}