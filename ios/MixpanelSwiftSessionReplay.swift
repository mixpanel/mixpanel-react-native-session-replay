import Foundation
import MixpanelSessionReplay
import UIKit

@objc public class MixpanelSwiftSessionReplay: NSObject {
  static let libVersion = "1.2.0"
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

  /// - Parameter wireframeHandler: Destination for each captured wireframe's debug JSON.
  ///   Attached only when the config's `debugOptions.emitWireframes` is set — that flag is the
  ///   switch, and it is a real property of the SDK's config model rather than a key read out of
  ///   the raw JSON. Without it the SDK builds no snapshot at all, so an app that has not asked
  ///   pays nothing.
  @objc public static func initialize(
    _ token: String, distinctId: String, configJSON: String,
    wireframeHandler: ((String) -> Void)? = nil,
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
      var config = try MPSessionReplayConfig.from(json: data)

      // `emitWireframes` is the serializable switch; `wireframeEmitter` is a closure and is
      // therefore excluded from `Codable`, so the bridge supplies the destination the config
      // could not carry. Read off the *decoded* config, not the raw JSON string.
      if let wireframeHandler, config.debugOptions?.emitWireframes == true {
        config.debugOptions?.wireframeEmitter = { snapshot in
          wireframeHandler(snapshot.toJson())
        }
      }

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

  @objc public static func flush(completionHandler: @escaping () -> Void) {
    guard let instance = MPSessionReplay.getInstance() else {
      completionHandler()
      return
    }
    instance.flush(completionHandler: completionHandler)
  }

  @objc public static func setMPReplaySensitive(value: Bool, view: UIView) {
    view.mpReplaySensitive = value
  }

  /// Declares the text recorded for `view` in the wireframe.
  ///
  /// Orthogonal to `setMPReplaySensitive` — the declared text is sent even when the view
  /// is masked, because it is authored by the developer rather than scraped from the
  /// screen. Pass `nil` (or a blank string) to clear it.
  @objc public static func setMPWireframeText(value: String?, view: UIView) {
    let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines)
    view.mpWireframeText = (trimmed?.isEmpty == false) ? trimmed : nil
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
