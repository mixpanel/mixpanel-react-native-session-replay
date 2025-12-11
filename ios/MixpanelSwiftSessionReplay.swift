import Foundation
import MixpanelSessionReplay
import UIKit

@objc public class MixpanelSwiftSessionReplay: NSObject {
  static let libVersion = "0.2.1"
  static let mpLib = "react-native-sr"

  @objc public static func startRecording(recordingSessionsPercent: Double = 100.0) {
    MPSessionReplay.getInstance()?.startRecording(sessionsPercent: recordingSessionsPercent)
  }

  @objc public static func stopRecording() {
    MPSessionReplay.getInstance()?.stopRecording()
  }

  @objc public static func captureScreenshot() {
    MPSessionReplay.getInstance()?.captureScreenshot()
  }

  @objc public static func initialize(
    _ token: String, distinctId: String, configJSON: String,
    completion: @escaping (Bool, NSError?) -> Void
  ) {
    guard let data = configJSON.data(using: .utf8) else {
      let error = createError("Invalid config JSON string", code: 3840)
      completion(false, error)
      return
    }

    do {
      APIConstants.setLibVersion(libVersion)
      APIConstants.setMpLib(mpLib)
      let config = try MPSessionReplayConfig.from(json: data)
      MPSessionReplay.initialize(token: token, distinctId: distinctId, config: config) { result in
        switch result {
        case .success(_?):
          setSensitiveClasses(config: config)
          completion(true, nil)

        case .success(nil):
          completion(false, createError("Instance found nil after successful initialisation."))

        case .failure(let error as MPSessionReplayError):
          let message: String
          switch error {
          case .disabledByRemoteSetting(let msg):
            message = msg
          case .failedToInitialize:
            message = "Failed to initialize the SDK: \(error)"
          default:
            message = "Session replay initialization failed: \(error)"
          }
          completion(false, createError(message))

        case .failure(let error):
          completion(false, createError("Session replay initialization failed: \(error)"))
        }
      }
    } catch {
      completion(false, error as NSError)
    }
  }

  @objc public static func isRecording() -> Bool {
    return MPSessionReplay.getInstance()?.isRecording ?? false
  }

  @objc public static func identify(_ distinctId: String) {
    MPSessionReplay.getInstance()?.identify(distinctId: distinctId)
  }

  @objc public static func getReplayId() -> String? {
    return MPSessionReplay.getReplayId()
  }

  @objc public static func setMPReplaySensitive(value: Bool, view: UIView) {
    view.mpReplaySensitive = value
  }

  private static func createError(_ message: String, code: Int = -1) -> NSError {
    return NSError(
      domain: "MixpanelSessionReplay",
      code: code,
      userInfo: [NSLocalizedDescriptionKey: message])
  }

  private static func setSensitiveClasses(config: MPSessionReplayConfig) {
    let legacyTextViewClass: AnyClass? = NSClassFromString("RCTTextView")
    let fabricTextViewClass: AnyClass? = NSClassFromString("RCTParagraphTextView")
    let imageViewClass: AnyClass? = NSClassFromString("RCTImageView")
    let sessionReplay = MPSessionReplay.getInstance()

    if let imageViewClass, config.autoMaskedViews.contains(.image) {
      sessionReplay?.addSensitiveClass(imageViewClass)
    }

    if let fabricTextViewClass, config.autoMaskedViews.contains(.text) {
      sessionReplay?.addSensitiveClass(fabricTextViewClass)
    }

    if let legacyTextViewClass, config.autoMaskedViews.contains(.text) {
      sessionReplay?.addSensitiveClass(legacyTextViewClass)
    }
  }
}
