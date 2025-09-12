package com.mixpanelreactnativesessionreplay

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager
import java.util.HashMap

class MixpanelReactNativeSessionReplayPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == MixpanelReactNativeSessionReplayModule.NAME) {
      MixpanelReactNativeSessionReplayModule(reactContext)
    } else {
      null
    }
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return listOf(MixpanelSessionReplayViewManager())
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()
      moduleInfos[MixpanelReactNativeSessionReplayModule.NAME] = ReactModuleInfo(
        MixpanelReactNativeSessionReplayModule.NAME,
        MixpanelReactNativeSessionReplayModule.NAME,
        false,  // canOverrideExistingModule
        false,  // needsEagerInit
        false,  // isCxxModule
        true // isTurboModule
      )
      moduleInfos
    }
  }
}
