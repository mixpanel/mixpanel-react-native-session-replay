import Foundation
import MixpanelSessionReplay

@objc public class SwiftMixpanelSessionReplay: NSObject {

  @objc public static func startRecording() {
    MPSessionReplay.getInstance()?.startRecording()
  }

  @objc public static func stopRecording() {
    MPSessionReplay.getInstance()?.stopRecording()
  }

  @objc public static func captureScreenshot() {
    MPSessionReplay.getInstance()?.captureScreenshot()
  }

  @objc public static func initialize(_ token: String, distinctId: String, configJSON: String) {
    guard let data = configJSON.data(using: .utf8) else { return }
    do {
      let config = try MPSessionReplayConfig.from(json: data)
      let replay = MPSessionReplay.initialize(token: token, distinctId: distinctId, config: config)
      replay?.loggingEnabled = true
    } catch {
      print("⚠️ Failed to parse config JSON: \(error)")
    }
  }
}
