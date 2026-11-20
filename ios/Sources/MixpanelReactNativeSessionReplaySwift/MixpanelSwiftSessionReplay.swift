import Foundation
import MixpanelSessionReplay
import MixpanelSwiftCommon
import UIKit

// The explicit Objective-C name keeps the class symbol identical under CocoaPods and Swift
// Package Manager, whose module names differ; MixpanelSwiftSessionReplay.h depends on it.
@objc(MixpanelSwiftSessionReplay) public class MixpanelSwiftSessionReplay: NSObject {
  static let libVersion = "2.1.0"
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
  ///   Attached only when the payload's `debugOptions.emitWireframes` is set — this bridge's own
  ///   debug switch, read here rather than modelled by the SDK (see `BridgeDebugFlags`). Without
  ///   it the SDK builds no snapshot at all, so an app that has not asked pays nothing.
  @objc public static func initialize(
    _ token: String, distinctId: String, configJSON: String,
    wireframeHandler: ((String) -> Void)? = nil,
    completion: @escaping (Bool, NSError?) -> Void
  ) {
    initializeSessionReplay(
      configJSON: configJSON, wireframeHandler: wireframeHandler, completion: completion
    ) { config, onResult in
      MPSessionReplay.initialize(
        token: token, distinctId: distinctId, config: config, completion: onResult)
    }
  }

  /// Hierarchical groups: initializes for a `MixpanelIdentity` sent as JSON, typically the one
  /// `mixpanel.getIdentity()` reports, so replays carry `$user_id`, `$company_id` and `$device_id`.
  @objc public static func initialize(
    _ token: String, identityJSON: String, configJSON: String,
    wireframeHandler: ((String) -> Void)? = nil,
    completion: @escaping (Bool, NSError?) -> Void
  ) {
    guard let identity = parseIdentity(identityJSON) else {
      completion(false, createError("identity requires a non-empty userId or deviceId"))
      return
    }
    initializeSessionReplay(
      configJSON: configJSON, wireframeHandler: wireframeHandler, completion: completion
    ) { config, onResult in
      MPSessionReplay.initialize(
        token: token, identity: identity, config: config, completion: onResult)
    }
  }

  /// Parses the config, then hands it to `start`, which calls whichever `MPSessionReplay.initialize`
  /// overload matches how the user is named, and reports its result through `completion`.
  private static func initializeSessionReplay(
    configJSON: String,
    wireframeHandler: ((String) -> Void)?,
    completion: @escaping (Bool, NSError?) -> Void,
    start: (
      MPSessionReplayConfig, @escaping (Result<MPSessionReplayInstance?, Error>) -> Void
    ) -> Void
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

      // `emitWireframes` is this bridge's switch, not SDK configuration; the SDK ignores the
      // key and the bridge attaches the destination the config could not carry.
      let emitWireframes =
        (try? JSONDecoder().decode(BridgeDebugFlags.self, from: data))?
        .debugOptions?.emitWireframes ?? false

      if let wireframeHandler, emitWireframes {
        config.debugOptions?.wireframeEmitter = { snapshot in
          wireframeHandler(snapshot.toJson())
        }
      }

      start(config) { result in
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

  /// Returns `false`, without identifying, when the identity names neither a user nor a device.
  @objc public static func identify(identityJSON: String) -> Bool {
    guard let identity = parseIdentity(identityJSON) else {
      return false
    }
    MPSessionReplay.getInstance()?.identify(identity: identity)
    return true
  }

  /// Reads `{"userId", "companyId", "deviceId"}` sent by JS, mapping missing, null and empty
  /// values to nil. Returns nil when the JSON is malformed or names neither a user nor a device.
  private static func parseIdentity(_ identityJSON: String) -> MixpanelIdentity? {
    guard let data = identityJSON.data(using: .utf8),
      let fields = try? JSONDecoder().decode(BridgeIdentity.self, from: data)
    else {
      return nil
    }
    func nonEmpty(_ value: String?) -> String? {
      return value?.isEmpty == false ? value : nil
    }
    let identity = MixpanelIdentity(
      userId: nonEmpty(fields.userId),
      companyId: nonEmpty(fields.companyId),
      deviceId: nonEmpty(fields.deviceId))
    return identity.userId == nil && identity.deviceId == nil ? nil : identity
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

/// The one key JS sends inside `debugOptions` that the SDK does not model.
///
/// `emitWireframes` is a bridge-level debug switch rather than SDK configuration: the SDK's
/// `DebugOptions.wireframeEmitter` is a closure and cannot cross the bridge as JSON, so JS sends
/// a boolean and the bridge supplies the callback. Keeping the flag here rather than in the SDK's
/// public `DebugOptions` leaves no inert knob on the native API surface.
private struct BridgeDebugFlags: Decodable {
  struct DebugSection: Decodable {
    var emitWireframes: Bool?
  }

  var debugOptions: DebugSection?
}

/// The identity JS sends to `initializeWithIdentity` and `identifyWithIdentity`.
private struct BridgeIdentity: Decodable {
  var userId: String?
  var companyId: String?
  var deviceId: String?
}
