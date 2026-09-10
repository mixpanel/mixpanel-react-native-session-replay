package com.mixpanelreactnativesessionreplay

import android.content.Context
import com.facebook.react.views.view.ReactViewGroup
import com.mixpanel.android.sessionreplay.MPSessionReplay
import com.mixpanel.android.sessionreplay.extensions.mpWireframeText

class MixpanelSessionReplayView(context: Context) : ReactViewGroup(context) {
    private var isSensitive: Boolean = false
    private var wireframeText: String? = null

    fun setSensitive(sensitive: Boolean) {
        if (isSensitive == sensitive) return
        
        isSensitive = sensitive
        updateViewSensitivity()
    }

    /**
     * Declares the text recorded for this view in the `mp_wireframe` event.
     *
     * Orthogonal to [setSensitive] — this has no bearing on which pixels are captured,
     * and masking has no bearing on the declared text. Unlike sensitivity, it needs no
     * live [MPSessionReplay] instance: the declaration is held by the SDK's view manager,
     * so a prop that arrives before `initialize` still applies.
     */
    fun setWireframeText(text: String?) {
        if (wireframeText == text) return

        wireframeText = text
        mpWireframeText(text)
    }
    
    private fun updateViewSensitivity() {
        MPSessionReplay.getInstance()?.let { sessionReplay ->
            if (isSensitive) {
                sessionReplay.addSensitiveView(this)
            } else {
                sessionReplay.addSafeView(this)
            }
        }
    }
}
