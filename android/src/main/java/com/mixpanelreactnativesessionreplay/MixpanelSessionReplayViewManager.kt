package com.mixpanelreactnativesessionreplay

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

@ReactModule(name = MixpanelSessionReplayViewManager.REACT_CLASS)
class MixpanelSessionReplayViewManager : ViewGroupManager<MixpanelSessionReplayView>() {

    companion object {
        const val REACT_CLASS = "MixpanelSessionReplayView"
    }

    override fun getName(): String {
        return REACT_CLASS
    }

    override fun createViewInstance(reactContext: ThemedReactContext): MixpanelSessionReplayView {
        return MixpanelSessionReplayView(reactContext)
    }

    @ReactProp(name = "sensitive")
    fun setSensitive(view: MixpanelSessionReplayView, sensitive: Boolean) {
        // log the sensitive property change
        println("MixpanelSessionReplayView - setSensitive called with value: $sensitive for view: $view")
        view.setSensitive(sensitive)
    }
}
