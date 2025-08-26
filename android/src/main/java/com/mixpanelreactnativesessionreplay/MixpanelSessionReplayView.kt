package com.mixpanelreactnativesessionreplay

import android.content.Context
import com.facebook.react.views.view.ReactViewGroup
import com.mixpanel.android.sessionreplay.MPSessionReplay

class MixpanelSessionReplayView(context: Context) : ReactViewGroup(context) {
    private var isSensitive: Boolean = false

    fun setSensitive(sensitive: Boolean) {
        if (isSensitive == sensitive) return
        
        isSensitive = sensitive
        updateSessionReplay()
    }
    
    private fun updateSessionReplay() {
        MPSessionReplay.getInstance()?.let { sessionReplay ->
            if (isSensitive) {
                sessionReplay.addSensitiveView(this)
            } else {
                sessionReplay.addSafeView(this)
            }
        }
    }
}
