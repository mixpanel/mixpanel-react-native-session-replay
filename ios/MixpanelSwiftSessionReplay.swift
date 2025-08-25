import Foundation
import MixpanelSessionReplay

@objc public class MixpanelSwiftSessionReplay: NSObject {

  @objc public static func startRecording() {
    MPSessionReplay.getInstance()?.startRecording()
  }

  @objc public static func stopRecording() {
    MPSessionReplay.getInstance()?.stopRecording()
  }

  @objc public static func captureScreenshot() {
    MPSessionReplay.getInstance()?.captureScreenshot()
  }

  @objc public static func initialize(_ token: String, distinctId: String, configJSON: String, completion: @escaping (Bool, Error?) -> Void) {
    guard let data = configJSON.data(using: .utf8) else { return }
    do {
      let config = try MPSessionReplayConfig.from(json: data)
      MPSessionReplay.initialize(token: token, distinctId: distinctId, config: config) { result in
        if case .failure(let error) = result {
          completion(false, error)
        } else {
          completion(true, nil)
        }
      }
    } catch {
      print("⚠️ Failed to parse config JSON: \(error)")
    }
  }
  
  @objc public static func isRecording() -> Bool {
    return MPSessionReplay.getInstance()?.isRecording ?? false
  }
  
  @objc public static func identify(_ distinctId: String) {
    MPSessionReplay.getInstance()?.identify(distinctId: distinctId) 
  }
}
