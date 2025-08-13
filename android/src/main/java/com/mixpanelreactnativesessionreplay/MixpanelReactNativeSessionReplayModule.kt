package com.mixpanelreactnativesessionreplay

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.mixpanel.android.sessionreplay.MPSessionReplay
import com.mixpanel.android.sessionreplay.MPSessionReplayError
import com.mixpanel.android.sessionreplay.models.MPSessionReplayConfig

@ReactModule(name = MixpanelReactNativeSessionReplayModule.NAME)
class MixpanelReactNativeSessionReplayModule(reactContext: ReactApplicationContext) :
  NativeMixpanelReactNativeSessionReplaySpec(reactContext) {

  override fun getName(): String {
    return NAME
  }

  override fun initialize(config: ReadableMap, promise: Promise) {
    try {
      val token = config.getString("token")
      val distinctId = config.getString("distinctId")

      if (token == null || distinctId == null) {
        promise.reject("INVALID_CONFIG", "Token and distinctId are required")
        return
      }

      // Configure Mixpanel Session Replay
      val replayConfig = MPSessionReplayConfig().apply {
        // print everything inside the config object as Log
        config.toHashMap().forEach { (key, value) ->
          println("Mixpanel - Config Key: $key, Value: $value")
        }

        if (config.hasKey("wifiOnly")) {
          wifiOnly = config.getBoolean("wifiOnly")
        }
        if (config.hasKey("autoStartRecording")) {
          autoStartRecording = config.getBoolean("autoStartRecording")
        }
        if (config.hasKey("recordingSessionsPercent")) {
          recordingSessionsPercent = config.getDouble("recordingSessionsPercent")
        }
        if (config.hasKey("enableLogging")) {
          enableLogging = config.getBoolean("enableLogging")
        }
      }

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

      promise.resolve(null)
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

  override fun markViewChildrenAsSafe(viewTag: Double, promise: Promise) {
    try {
      val uiManager =
        reactApplicationContext.getNativeModule(com.facebook.react.uimanager.UIManagerModule::class.java)
      uiManager?.addUIBlock { nativeViewHierarchyManager ->
        val parentView = nativeViewHierarchyManager.resolveView(viewTag.toInt())

        if (parentView is MixpanelSessionReplayView) {
          // Only process if it's actually our component type
          parentView.markOnlyDirectChildrenAsSafe()
        } else {
          promise.reject("INVALID_VIEW_TYPE", "View is not a MixpanelSessionReplayView")
          return@addUIBlock
        }

        promise.resolve(null)
      }
    } catch (e: Exception) {
      promise.reject("MARK_CHILDREN_SAFE_ERROR", e.message, e)
    }
  }

  companion object {
    const val NAME = "MixpanelReactNativeSessionReplay"
  }
}
