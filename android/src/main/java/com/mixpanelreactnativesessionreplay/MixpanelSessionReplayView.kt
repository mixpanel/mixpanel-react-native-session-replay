package com.mixpanelreactnativesessionreplay

import android.content.Context
import com.facebook.react.views.view.ReactViewGroup
import com.mixpanel.android.sessionreplay.MPSessionReplay
import com.mixpanel.android.sessionreplay.extensions.mpWireframeText
import java.util.Collections
import java.util.WeakHashMap

internal class WireframeTextDeclaration(
    private val applyText: (String?) -> Unit,
) {
    private var text: String? = null

    init {
        WireframeTextDeclarationRegistry.register(this)
    }

    fun update(text: String?) {
        if (this.text == text) return

        this.text = text
        applyText(text)
    }

    fun reapply() {
        // A null value means the declaration is already absent from the freshly reset SDK registry.
        text?.let(applyText)
    }
}

internal object WireframeTextDeclarationRegistry {
    private val declarations =
        Collections.synchronizedMap(WeakHashMap<WireframeTextDeclaration, Unit>())

    fun register(declaration: WireframeTextDeclaration) {
        declarations[declaration] = Unit
    }

    fun reapplyAll() {
        val snapshot = synchronized(declarations) { declarations.keys.toList() }
        snapshot.forEach(WireframeTextDeclaration::reapply)
    }

    internal fun clearForTests() {
        declarations.clear()
    }
}

class MixpanelSessionReplayView(context: Context) : ReactViewGroup(context) {
    private var isSensitive: Boolean = false
    private val wireframeTextDeclaration = WireframeTextDeclaration(::mpWireframeText)

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
        wireframeTextDeclaration.update(text)
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
