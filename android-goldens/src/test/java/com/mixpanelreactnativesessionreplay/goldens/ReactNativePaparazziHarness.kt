package com.mixpanelreactnativesessionreplay.goldens

import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import app.cash.paparazzi.Paparazzi
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.views.image.ReactImageView
import com.facebook.react.views.text.ReactTextView
import com.facebook.react.views.view.ReactViewGroup
import com.mixpanel.android.sessionreplay.models.SensitiveRule
import com.mixpanel.android.sessionreplay.sensitive_views.SensitiveViewManager
import com.mixpanel.android.sessionreplay.wireframe.WireframeElement
import com.mixpanel.android.sessionreplay.wireframe.WireframeEmitter
import java.util.WeakHashMap

/**
 * Runs the SDK's real masking pipeline over a **React Native** view tree laid out by layoutlib.
 *
 * Deliberately a port of the SDK repo's `WireframePaparazziHarness` rather than a shared artifact:
 * the format is shared across platforms, the files and harnesses are not (coordinates differ), and
 * a test-only harness is not worth publishing to couple two repos together.
 *
 * **The walk must happen during the render.** Paparazzi detaches the view tree once `snapshot()`
 * returns, which leaves the root's parent chain terminating at `null`. While rendering,
 * layoutlib's own root is properly parented, so `View.isShown` — the gate at the top of
 * `processSubviews` — behaves as it does on a device. Hence the `onLayout` hook rather than
 * inspecting the tree afterwards.
 */
internal class ReactNativePaparazziHarness(private val paparazzi: Paparazzi) {

    /**
     * A finished capture: the processed element list, the viewport it was measured in, and the
     * mask rectangles the screenshot would paint.
     *
     * The mask frames are recorded because several masking cases are otherwise unfalsifiable: a
     * masked image has no text to lose, so its element is byte-identical to the unmasked one and
     * the golden cannot tell whether masking happened at all. Mirrors the iOS SDK's
     * `.masks.json` companion files.
     */
    data class Capture(
        val elements: List<WireframeElement>,
        val viewport: List<Int>,
        val maskFrames: List<android.graphics.Rect>
    )

    /** Invokes [onLaidOut] exactly once, from inside a real layout pass. */
    private class WalkHost(
        context: Context,
        private val onLaidOut: (View) -> Unit
    ) : FrameLayout(context) {
        private var walked = false

        override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
            super.onLayout(changed, l, t, r, b)
            if (!walked) {
                walked = true
                applyReactPlacements(this)
                onLaidOut(this)
            }
        }
    }

    fun capture(
        rules: List<SensitiveRule> = emptyList(),
        content: (Context) -> View
    ): Capture {
        var capture: Capture? = null
        val host = WalkHost(paparazzi.context) { root -> capture = walk(root, rules) }
        host.addView(
            content(paparazzi.context),
            ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        )
        paparazzi.snapshot(host)
        return requireNotNull(capture) { "Layout pass never ran — content produced no layout." }
    }

    companion object {
        /**
         * Absolute placement inside a [FrameLayout], so a golden's coordinates are dictated by the
         * case rather than by intrinsic text measurement. Real layout still runs — this only fixes
         * where it runs.
         */
        fun at(x: Int, y: Int, w: Int, h: Int): FrameLayout.LayoutParams =
            FrameLayout.LayoutParams(w, h).apply {
                leftMargin = x
                topMargin = y
            }

        /** Pending placements for children of a [ReactViewGroup], applied during layout. */
        private val reactPlacements = WeakHashMap<View, IntArray>()

        /**
         * Adds [child] to this [ReactViewGroup] at bounds relative to it.
         *
         * **`ReactViewGroup.onLayout` is a no-op**, because React Native does not use Android
         * layout: Yoga computes every frame in JS and the ViewManager calls `View.layout(...)` on
         * each child directly. A child merely `addView`n to one is therefore never measured, ends
         * up 0x0, and is dropped by the SDK's `width > 0 && height > 0` guard — which silently
         * turns any nesting golden into a vacuous empty one. (It did: the first run of this suite
         * produced two goldens with `"elements": []` that looked like passing tests.)
         *
         * So this records the frame and [applyReactPlacements] applies it during the host's layout
         * pass, doing exactly what the ViewManager would. Real bounds, real parent offsets, real
         * `getGlobalVisibleRect` — only the source of the numbers is the test instead of Yoga.
         */
        fun ReactViewGroup.addReactChild(child: View, x: Int, y: Int, w: Int, h: Int) {
            addView(child)
            reactPlacements[child] = intArrayOf(x, y, w, h)
        }

        private fun applyReactPlacements(root: View) {
            reactPlacements[root]?.let { (x, y, w, h) ->
                root.measure(
                    View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY),
                    View.MeasureSpec.makeMeasureSpec(h, View.MeasureSpec.EXACTLY)
                )
                root.layout(x, y, x + w, y + h)
            }
            if (root is ViewGroup) {
                for (i in 0 until root.childCount) applyReactPlacements(root.getChildAt(i))
            }
        }

        private operator fun IntArray.component1() = this[0]
        private operator fun IntArray.component2() = this[1]
        private operator fun IntArray.component3() = this[2]
        private operator fun IntArray.component4() = this[3]

        /**
         * Everything React Native needs before one of its views can be built and drawn on the JVM.
         *
         * Two things, both one-time and idempotent, so every case can call it:
         *
         * 1. **Feature flags off the JNI path.** `ReactImageView` reads
         *    `ReactNativeFeatureFlags` while it lays out, and the default accessor resolves them
         *    through `ReactNativeFeatureFlagsCxxInterop` — a native library that does not exist
         *    off-device (`UnsatisfiedLinkError: no react_featureflagsjni`).
         *    `ReactNativeFeatureFlagsForTests.setUp()` is React Native's own seam for this: it
         *    swaps in the pure-JVM `ReactNativeFeatureFlagsLocalAccessor`. Note that the public
         *    `ReactNativeFeatureFlags.override(...)` does **not** work here — it goes through the
         *    current (Cxx) accessor to do the overriding, so it throws the very error it would be
         *    called to avoid.
         * 2. **Fresco initialized first.** `ReactImageView` is a Fresco `DraweeView`, and Fresco
         *    must be initialized *before* the first controller builder is requested or the
         *    constructor throws an NPE out of `PipelineDraweeControllerBuilderSupplier`.
         */
        fun prepareReactNative(context: Context) {
            if (!flagsOverridden) {
                ReactNativeFeatureFlagsForTests.setUp()
                flagsOverridden = true
            }
            if (!Fresco.hasBeenInitialized()) Fresco.initialize(context)
        }

        private var flagsOverridden = false

        /** Resets every piece of [SensitiveViewManager] global state a case can touch. */
        fun resetMaskingState() {
            SensitiveViewManager.deinitialize()
            // `deinitialize()` clears registered classes as of SDK 1.4.0-wire10 — a new
            // initialization is a new initialization. The explicit removes below are belt and
            // braces for exactly one failure mode, and they earn their keep: while the SDK still
            // kept registrations, the two `class*` cases leaked `ReactTextView` into every case
            // that ran after them and eight goldens recorded EXPLICIT with their text nulled,
            // all green, with which ones affected depending on JUnit's ordering. If this module
            // is ever built against an older SDK, these keep the suite honest instead of
            // silently re-masking everything.
            SensitiveViewManager.removeSensitiveClass(ReactTextView::class.java)
            SensitiveViewManager.removeSensitiveClass(ReactImageView::class.java)
            SensitiveViewManager.autoMaskedViews = emptySet()
            // Deliberately *not* the shipped default (off): most goldens exercise the label tier,
            // and the `*_fallbackOff_*` cases turn it back off per-case.
            SensitiveViewManager.useAccessibilityLabelFallback = true
        }
    }

    private fun walk(root: View, rules: List<SensitiveRule>): Capture {
        val collected = mutableListOf<WireframeElement>()
        val summary = SensitiveViewManager.processSubviews(root, collected)
        // Sorted by (y, x), matching the iOS suite. The walk's own order follows the view
        // hierarchy, which React Native is free to reorder between versions, and an unsorted
        // list cannot be diffed against the iOS golden for the same case — which is the reason
        // the two suites share case names at all. The cost is that element *order* is not
        // pinned for React Native the way the Android SDK's `order_*` cases pin it; reading
        // order is, which is what a summary consumes.
        val processed = WireframeEmitter(sensitiveRules = rules)
            .processForTesting(collected, summary.boundsSnapshot)
            .sortedWith(compareBy({ it.y }, { it.x }))
        // Bounds only, no decision label: Android's `SubviewSummary.boundsSnapshot` is a
        // `Set<Rect>` and carries none at this seam. The iOS SDK's own `.masks.json` files add a
        // `decision` field; the two React Native suites match each other instead, which is what
        // makes them diffable.
        val masks = summary.boundsSnapshot.sortedWith(compareBy({ it.top }, { it.left }))
        return Capture(processed, listOf(root.width, root.height), masks)
    }
}
