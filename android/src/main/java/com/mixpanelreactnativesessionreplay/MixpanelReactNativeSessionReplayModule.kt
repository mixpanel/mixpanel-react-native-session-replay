package com.mixpanelreactnativesessionreplay

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.mixpanel.android.sessionreplay.MPSessionReplay
import com.mixpanel.android.sessionreplay.MPSessionReplayError
import com.mixpanel.android.sessionreplay.models.MPSessionReplayConfig
import com.mixpanel.android.sessionreplay.sensitive_views.AutoMaskedView
import org.json.JSONObject
import org.json.JSONArray

@ReactModule(name = MixpanelReactNativeSessionReplayModule.NAME)
class MixpanelReactNativeSessionReplayModule(reactContext: ReactApplicationContext) :
  NativeMixpanelReactNativeSessionReplaySpec(reactContext) {

  override fun getName(): String {
    return NAME
  }

  override fun initialize(token: String, distinctId: String, configJSON: String, promise: Promise) {
    try {
      if (token.isEmpty() || distinctId.isEmpty()) {
        promise.reject("INVALID_CONFIG", "Token and distinctId are required")
        return
      }

      // Parse JSON configuration
      val config = if (configJSON.isNotEmpty()) {
        try {
          JSONObject(configJSON)
        } catch (e: Exception) {
          println("Mixpanel - Failed to parse config JSON: ${e.message}")
          JSONObject()
        }
      } else {
        JSONObject()
      }

      // Configure Mixpanel Session Replay

      val replayConfig = try {
        MPSessionReplayConfig.fromJson(configJSON)
      } catch (e: Exception) {
        println("Mixpanel - Failed to parse config JSON in fromJson: ${e.message}")
        promise.reject("CONFIG_JSON_PARSE_ERROR", "Failed to parse config JSON: ${e.message}", e)
        return
      }
      println("Mixpanel - Config variable fromJson: $replayConfig")

      // Initialize Mixpanel Session Replay
      MPSessionReplay.initialize(
        reactApplicationContext,
        token,
        distinctId,
        replayConfig
      ) { result ->
        result.fold(
          onSuccess = { instance ->
            // Successfully initialized
            MPSessionReplay.getInstance()?.let {
              println("Mixpanel - Session Replay initialized successfully")
              promise.resolve(null)
            } ?: run {
              promise.reject("INITIALIZATION_ERROR", "Session Replay instance is null")
            }
          },
          onFailure = { error ->
            when (error) {
              is MPSessionReplayError.Disabled -> {
                promise.reject("SESSION_REPLAY_DISABLED", error.reason)
              }

              is MPSessionReplayError.InitializationError -> {
                promise.reject("INITIALIZATION_ERROR", error.cause.message, error.cause)
              }

              else -> {
                promise.reject(
                  "UNKNOWN_ERROR",
                  "An unknown error occurred during initialization",
                  error
                )
              }
            }
          }
        )
      }
    } catch (e: Exception) {
      promise.reject("INITIALIZATION_ERROR", e.message, e)
    }
  }

  override fun startRecording(promise: Promise) {
    try {
      MPSessionReplay.getInstance()?.startRecording()
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("START_RECORDING_ERROR", e.message, e)
    }
  }

  override fun stopRecording(promise: Promise) {
    try {
      MPSessionReplay.getInstance()?.stopRecording()
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("STOP_RECORDING_ERROR", e.message, e)
    }
  }

  override fun isRecording(promise: Promise) {
    try {
//      val recording = MPSessionReplay.isRecording()
      val recording = true
      promise.resolve(recording)
    } catch (e: Exception) {
      promise.reject("IS_RECORDING_ERROR", e.message, e)
    }
  }

  override fun identify(distinctId: String, promise: Promise) {
    try {
      if (distinctId.isEmpty()) {
        promise.reject("INVALID_DISTINCT_ID", "distinctId is required")
        return
      }

      MPSessionReplay.getInstance()?.identify(distinctId)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("IDENTIFY_ERROR", e.message, e)
    }
  }


  companion object {
    const val NAME = "MixpanelReactNativeSessionReplay"
  }
}
