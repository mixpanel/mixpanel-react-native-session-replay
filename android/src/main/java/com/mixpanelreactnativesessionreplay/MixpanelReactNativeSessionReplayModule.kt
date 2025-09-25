package com.mixpanelreactnativesessionreplay

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.mixpanel.android.sessionreplay.MPSessionReplay
import com.mixpanel.android.sessionreplay.MPSessionReplayInstance
import com.mixpanel.android.sessionreplay.MPSessionReplayError
import com.mixpanel.android.sessionreplay.models.MPSessionReplayConfig
import com.mixpanel.android.sessionreplay.sensitive_views.AutoMaskedView
import com.mixpanel.android.sessionreplay.utils.APIConstants
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

      // Set library version and name
      APIConstants.setLibVersion(LIB_VERSION)
      APIConstants.setMpLib(MP_LIB)

      // Initialize Mixpanel Session Replay
      MPSessionReplay.initialize(
        reactApplicationContext,
        token,
        distinctId,
        replayConfig
      ) { result ->
        result.fold(
          onSuccess = { sessionReplayInstance ->
            // Successfully initialized
            sessionReplayInstance?.let { instance ->
              try {
                // Configure AutoMaskedView categories with comprehensive React Native support
                configureSensitiveClasses(instance, replayConfig)
                println("Mixpanel - Session Replay initialized successfully with enhanced view masking")
                promise.resolve(null)
              } catch (e: Exception) {
                println("Mixpanel - Error configuring sensitive classes: ${e.message}")
                // Still resolve as initialization succeeded, but log the configuration error
                promise.resolve(null)
              }
            } ?: run {
              promise.reject(
                "INITIALIZATION_ERROR",
                "Session Replay instance is null after successful initialization"
              )
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


  /**
   * Safely configure sensitive classes for comprehensive React Native view masking
   * Supports both old and new React Native architectures with crash prevention
   */
  private fun configureSensitiveClasses(
    mpInstance: MPSessionReplayInstance,
    config: MPSessionReplayConfig
  ) {
    // Always mask input text classes to protect user input fields
    configureInputTextClasses(mpInstance)

    if (config.autoMaskedViews.contains(AutoMaskedView.Text)) {
      configureTextClasses(mpInstance)
    }

    if (config.autoMaskedViews.contains(AutoMaskedView.Image)) {
      configureImageClasses(mpInstance)
    }

    if (config.autoMaskedViews.contains(AutoMaskedView.Web)) {
      configureWebClasses(mpInstance)
    }
  }

  /**
   * Configure text display view classes for masking
   */
  private fun configureTextClasses(mpInstance: MPSessionReplayInstance) {
    val textClasses = listOf(
      // React Native specific text display views
      "com.facebook.react.views.text.ReactTextView",
      "com.facebook.react.views.text.ReactTextAnchorView",

      // New Architecture (Fabric) text display views
      "com.facebook.react.fabric.views.text.ReactTextView"
    )

    textClasses.forEach { className ->
      safeAddSensitiveClass(mpInstance, className, "Text")
    }
  }

  /**
   * Configure text input view classes for masking
   */
  private fun configureInputTextClasses(mpInstance: MPSessionReplayInstance) {
    val inputTextClasses = listOf(
      // React Native specific text input views
      "com.facebook.react.views.textinput.ReactEditText",

      // New Architecture (Fabric) text input views
      "com.facebook.react.fabric.views.textinput.ReactEditText"
    )

    inputTextClasses.forEach { className ->
      safeAddSensitiveClass(mpInstance, className, "Input Text")
    }
  }

  /**
   * Configure image-related view classes for masking
   */
  private fun configureImageClasses(mpInstance: MPSessionReplayInstance) {
    val imageClasses = listOf(
      // React Native specific image views
      "com.facebook.react.views.image.ReactImageView",
      "com.facebook.react.views.text.frescosupport.FrescoBasedReactTextInlineImageSpan",

      // New Architecture (Fabric) image views
      "com.facebook.react.fabric.views.image.ReactImageView",

      // Common third-party image libraries
      "com.facebook.drawee.view.SimpleDraweeView"
    )

    imageClasses.forEach { className ->
      safeAddSensitiveClass(mpInstance, className, "Image")
    }
  }

  /**
   * Configure web-related view classes for masking
   */
  private fun configureWebClasses(mpInstance: MPSessionReplayInstance) {
    val webClasses = listOf(
      // React Native WebView (community package)
      "com.reactnativecommunity.webview.RNCWebView",
      "com.reactnativecommunity.webview.RNCWebViewManager.RNCWebView",

      // Legacy React Native WebView
      "com.facebook.react.views.webview.ReactWebView",

      // New Architecture (Fabric) web views
      "com.facebook.react.fabric.views.webview.ReactWebView"
    )

    webClasses.forEach { className ->
      safeAddSensitiveClass(mpInstance, className, "Web")
    }
  }

  /**
   * Safely add a sensitive class with comprehensive error handling
   * Prevents crashes from ClassNotFoundException or other reflection issues
   */
  private fun safeAddSensitiveClass(
    mpInstance: MPSessionReplayInstance,
    className: String,
    category: String
  ) {
    try {
      val clazz = Class.forName(className)
      mpInstance.addSensitiveClass(clazz)
      println("Mixpanel - Successfully added $category class: $className")
    } catch (e: ClassNotFoundException) {
      // Class not found - this is expected for architecture-specific or optional classes
      println("Mixpanel - $category class not available (expected): $className")
    } catch (e: NoClassDefFoundError) {
      // Missing dependencies - log but don't crash
      println("Mixpanel - $category class dependencies not available: $className - ${e.message}")
    } catch (e: LinkageError) {
      // Linking issues - log but don't crash
      println("Mixpanel - $category class linking error: $className - ${e.message}")
    } catch (e: Exception) {
      // Any other reflection-related issues
      println("Mixpanel - Unexpected error adding $category class $className: ${e.message}")
    }
  }

  companion object {
    const val NAME = "MixpanelReactNativeSessionReplay"
    const val LIB_VERSION = "0.1.1"
    const val MP_LIB = "react-native-sr"
  }
}
