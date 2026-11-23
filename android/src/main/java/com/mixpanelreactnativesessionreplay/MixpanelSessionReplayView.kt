package com.mixpanelreactnativesessionreplay

import android.content.Context
import com.facebook.react.views.view.ReactViewGroup
import com.mixpanel.android.sessionreplay.MPSessionReplay
import com.mixpanel.android.sessionreplay.extensions.mpReplaySensitive
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

/**
 * The `sensitive` prop of one view, applied to the SDK's view manager.
 *
 * Starts unset rather than `false`, so the first value is always applied: a view that
 * mounts with `sensitive={false}` is registered as safe, not skipped.
 */
internal class SensitivityDeclaration(
    private val applySensitivity: (Boolean) -> Unit,
) {
    private var sensitive: Boolean? = null

    init {
        SensitivityDeclarationRegistry.register(this)
    }

    fun update(sensitive: Boolean) {
        if (this.sensitive == sensitive) return

        this.sensitive = sensitive
        applySensitivity(sensitive)
    }

    fun reapply() {
        // Null means the prop never arrived, so there is nothing to restore.
        sensitive?.let(applySensitivity)
    }
}

internal object SensitivityDeclarationRegistry {
    private val declarations =
        Collections.synchronizedMap(WeakHashMap<SensitivityDeclaration, Unit>())

    fun register(declaration: SensitivityDeclaration) {
        declarations[declaration] = Unit
    }

    fun reapplyAll() {
        val snapshot = synchronized(declarations) { declarations.keys.toList() }
        snapshot.forEach(SensitivityDeclaration::reapply)
    }

    internal fun clearForTests() {
        declarations.clear()
    }
}

class MixpanelSessionReplayView(context: Context) : ReactViewGroup(context) {
    private val sensitivityDeclaration = SensitivityDeclaration(::mpReplaySensitive)
    private val wireframeTextDeclaration = WireframeTextDeclaration(::mpWireframeText)

    /**
     * Marks this view as sensitive (masked) or safe (unmasked) in recordings.
     *
     * Like [setWireframeText], this needs no live [MPSessionReplay] instance: the
     * declaration is held by the SDK's view manager, so a prop that arrives before
     * `initialize` still applies.
     */
    fun setSensitive(sensitive: Boolean) {
        sensitivityDeclaration.update(sensitive)
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
}
