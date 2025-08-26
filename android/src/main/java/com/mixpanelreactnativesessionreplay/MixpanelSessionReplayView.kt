package com.mixpanelreactnativesessionreplay

import android.content.Context
import com.facebook.react.views.view.ReactViewGroup
import com.mixpanel.android.sessionreplay.MPSessionReplay

class MixpanelSessionReplayView(context: Context) : ReactViewGroup(context) {

  fun setSensitive(sensitive: Boolean) {
    val sessionReplay = MPSessionReplay.getInstance()
    if (sessionReplay != null) {
      if (sensitive) {
        sessionReplay.addSensitiveView(this)
      } else {
        sessionReplay.addSafeView(this)
      }
    }
  }
}
