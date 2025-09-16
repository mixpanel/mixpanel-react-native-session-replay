import Foundation
import UIKit
import MixpanelSessionReplay

@objc public class MixpanelSwiftSensitiveViewManager: NSObject {
  @objc public static func setMPReplaySensitive(value: Bool, view: UIView) {
    // Your Swift logic here
    view.mpReplaySensitive = value
  }
}
