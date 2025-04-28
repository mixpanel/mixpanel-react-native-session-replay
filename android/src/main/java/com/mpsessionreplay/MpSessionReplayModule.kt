package com.mpsessionreplay

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.mixpanel.android.mpmetrics.MixpanelAPI
import com.mixpanel.mixpanel_android_session_replay.MPSessionReplay
import com.mixpanel.mixpanel_android_session_replay.models.MPSessionReplayConfig
import org.json.JSONObject

@ReactModule(name = MpSessionReplayModule.NAME)
class MpSessionReplayModule(reactContext: ReactApplicationContext) :
    NativeMpSessionReplaySpec(reactContext) {

    override fun getName(): String {
        return NAME
    }

    override fun initialize(token: String?, distinctId: String?, configJSON: String?) {
        val trackAutomaticEvents = true
        val mixpanel = MixpanelAPI.getInstance(reactApplicationContext, token, trackAutomaticEvents)
        mixpanel.identify(distinctId)

        val props = JSONObject()
        props.put("source", "Pat's affiliate site")
        props.put("Opted out of email", true)

        mixpanel.track("Sign Up", props)

        if (configJSON != null) {
            val config = MPSessionReplayConfig.fromJson(configJSON)
            if (token != null) {
                currentActivity?.let {
                    if (android.os.Looper.getMainLooper().thread == Thread.currentThread()) {
                        MPSessionReplay.initialize(
                            it,
                            token,
                            mixpanel.distinctId,
                            config
                        )
                    } else {
                        android.os.Handler(android.os.Looper.getMainLooper()).post {
                            MPSessionReplay.initialize(
                                it,
                                token,
                                mixpanel.distinctId,
                                config
                            )
                        }
                    }
                }
            }
        }
    }

    override fun startRecording() {
        android.os.Handler(android.os.Looper.getMainLooper()).post {
            MPSessionReplay.getInstance()?.startRecording()
        }
    }

    override fun stopRecording() {
        android.os.Handler(android.os.Looper.getMainLooper()).post {
            MPSessionReplay.getInstance()?.stopRecording()
        }
    }

    override fun captureScreenshot() {
        TODO("Not yet implemented")
    }

    companion object {
        const val NAME = "MpSessionReplay"
    }
}
