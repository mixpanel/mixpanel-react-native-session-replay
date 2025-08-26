package com.mixpanelreactnativesessionreplay

import android.content.Context
import com.facebook.react.views.view.ReactViewGroup
import com.mixpanel.android.sessionreplay.MPSessionReplay

class MixpanelSessionReplayView(context: Context) : ReactViewGroup(context) {
  private var isSensitive: Boolean = false

  fun setSensitive(sensitive: Boolean) {
    isSensitive = sensitive
    val sessionReplay = MPSessionReplay.getInstance()
    if (sessionReplay != null) {
      if (isSensitive) {
        sessionReplay.addSensitiveView(this)
      } else {
        sessionReplay.addSafeView(this)
      }
    }
  }
}
