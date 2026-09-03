package com.mixpanelreactnativesessionreplay.goldens

import android.content.Context
import android.view.View
import android.widget.FrameLayout
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.react.views.image.ReactImageView
import com.facebook.react.views.text.ReactTextView
import com.facebook.react.views.view.ReactViewGroup
import com.mixpanel.android.sessionreplay.extensions.mpReplaySensitive
import com.mixpanel.android.sessionreplay.extensions.mpWireframeText
import com.mixpanel.android.sessionreplay.models.SensitiveRule
import com.mixpanel.android.sessionreplay.sensitive_views.AutoMaskedView
import com.mixpanel.android.sessionreplay.sensitive_views.SensitiveViewManager
import com.mixpanelreactnativesessionreplay.goldens.ReactNativePaparazziHarness.Companion.addReactChild
import com.mixpanelreactnativesessionreplay.goldens.ReactNativePaparazziHarness.Companion.at
import org.junit.Before
import org.junit.Rule
import org.junit.Test

/**
 * Coordinate goldens for the wireframe captured over a **React Native** view tree on Android.
 *
 * The SDK's own goldens pin the walk over plain `TextView` / `ImageView` / `ViewGroup`. These pin
 * it over the views React Native actually creates — `ReactTextView`, `ReactImageView`,
 * `ReactViewGroup` — because those are what a React Native upgrade can change underneath us. A
 * renamed class, a changed superclass, or a view that stops exposing its text shows up here and
 * in no other suite.
 *
 * **The case list is the cross-platform matrix, not a selection.** Every principle the Android
 * SDK, Flutter and iOS suites pin is pinned here too, under the same case name where the concept
 * is the same, so a reviewer can diff platforms case by case. Where React Native genuinely has no
 * equivalent the case still exists and pins the *documented* behaviour rather than being dropped
 * — `touchableIsContainerNotButton` is the clearest example. The counterpart iOS suite lives in
 * `example/ios/WireframeGoldenTests` and carries the same names.
 *
 * Coordinates come from layoutlib at the [DeviceConfig] below, not from a device, so they are
 * stable without pinning an emulator. Every case places its views absolutely with [at] so a
 * golden's numbers are dictated by the case rather than by intrinsic text measurement.
 *
 * **`ReactEditText` cannot be rendered here** — its constructor casts its `Context` to
 * `ThemedReactContext`, which needs a live React instance. Input cases therefore use a plain
 * `EditText`, which is what `ReactEditText` *is*; that the relationship still holds is asserted
 * by [ReactNativeViewContractTest], and it is the part that carries the upgrade risk.
 */
class ReactNativeWireframeGoldenTest {

    @get:Rule
    val paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    private val harness by lazy { ReactNativePaparazziHarness(paparazzi) }

    @Before
    fun resetState() {
        ReactNativePaparazziHarness.resetMaskingState()
        ReactNativePaparazziHarness.prepareReactNative(paparazzi.context)
    }

    // ---- Helpers ---------------------------------------------------------------------------

    /** Captures [content] and asserts it against `<name>.json`. */
    private fun golden(
        name: String,
        rules: List<SensitiveRule> = emptyList(),
        content: (Context) -> View
    ) {
        WireframeGoldenFormat.assertGolden(harness.capture(rules, content), "$name.json")
    }

    private fun text(context: Context, value: String) =
        ReactTextView(context).apply { text = value }

    /** See the class doc: `ReactEditText` cannot be constructed off-device. */
    private fun input(context: Context, value: String) =
        android.widget.EditText(context).apply { setText(value) }

    private fun image(context: Context) =
        ReactImageView(context, Fresco.newDraweeControllerBuilder(), null, null)

    /**
     * Sets React Native's `accessibilityRole` the way `ReactAccessibilityDelegate` does — an
     * `AccessibilityRole` enum in the `accessibility_role` view tag.
     *
     * The tag id is looked up the same way the SDK looks it up, so if React Native ever renames
     * the resource these cases fail rather than silently stop exercising the path.
     */
    private fun <T : View> roled(view: T, role: String): T = view.apply {
        val id = resources.getIdentifier("accessibility_role", "id", context.packageName)
        check(id != 0) { "React Native's accessibility_role resource id was not found" }
        setTag(id, role)
    }

    /** React Native's `accessibilityLabel` prop lands on `contentDescription` on Android. */
    private fun <T : View> labelled(view: T, label: String): T =
        view.apply { contentDescription = label }

    private fun frame(context: Context, build: FrameLayout.() -> Unit) =
        FrameLayout(context).apply(build)

    // ==== TEXT ==========================================================================

    @Test
    fun textPlain() = golden("rn_text_plain") { ctx ->
        frame(ctx) { addView(text(ctx, "Order total"), at(16, 24, 240, 22)) }
    }

    /** Text automasking, the shipped default: place kept, words gone. */
    @Test
    fun textAutoMasked() {
        SensitiveViewManager.autoMaskedViews = setOf(AutoMaskedView.Text)
        golden("rn_text_auto_masked") { ctx ->
            frame(ctx) { addView(text(ctx, "Order total"), at(16, 24, 240, 22)) }
        }
    }

    /** `<MPSessionReplayView sensitive>` around a `<Text>`. */
    @Test
    fun textExplicitMasked() = golden("rn_text_explicit_masked") { ctx ->
        frame(ctx) {
            addView(
                text(ctx, "4111 1111 1111 1111").apply { mpReplaySensitive(true) },
                at(16, 24, 300, 22)
            )
        }
    }

    /** `sensitive={false}` is an unmask: it overrides automasking, and the text survives. */
    @Test
    fun textUnmaskOverridesAuto() {
        SensitiveViewManager.autoMaskedViews = setOf(AutoMaskedView.Text)
        golden("rn_text_unmask_overrides_auto") { ctx ->
            frame(ctx) {
                addView(
                    text(ctx, "Public notice").apply { mpReplaySensitive(false) },
                    at(16, 24, 240, 22)
                )
            }
        }
    }

    /** The 50-char cap, ellipsis included. Same limit on all four platforms. */
    @Test
    fun textTruncated() = golden("rn_text_truncated") { ctx ->
        frame(ctx) {
            addView(
                text(ctx, "This paragraph is comfortably longer than the fifty character cap"),
                at(16, 24, 300, 60)
            )
        }
    }

    /** Visible text is tier 2, so the label flag cannot take it away. */
    @Test
    fun textFallbackOffKeepsText() {
        SensitiveViewManager.useAccessibilityLabelFallback = false
        golden("rn_text_fallback_off_keeps_text") { ctx ->
            frame(ctx) { addView(text(ctx, "Order total"), at(16, 24, 240, 22)) }
        }
    }

    /**
     * Both a visible string and a label, with the fallback off: the visible text wins.
     *
     * The precedence case — `textFallbackOffKeepsText` only shows that text with *no* label
     * survives, which a bug that preferred the label would also satisfy. Matches the Android
     * SDK's and Flutter's `button_label_fallback_off_with_text`.
     */
    @Test
    fun textLabelFallbackOffWithText() {
        SensitiveViewManager.useAccessibilityLabelFallback = false
        golden("rn_text_label_fallback_off_with_text") { ctx ->
            frame(ctx) {
                addView(labelled(text(ctx, "Order total"), "ignored label"), at(16, 24, 240, 22))
            }
        }
    }

    /**
     * Declared text is taken verbatim, so glyphs the scraper would null survive.
     *
     * Declared text skips normalization entirely — it is authored, not scraped, so it is not
     * second-guessed for glyph content. The counterpart to [iconGlyphNulled], and the Android
     * SDK's `declared_glyph_kept`.
     */
    @Test
    fun declaredGlyphKept() = golden("rn_declared_glyph_kept") { ctx ->
        frame(ctx) {
                        // Declared only, no visible text — the same shape as the SDK's `declared_glyph_kept`.
            addView(text(ctx, "").apply { mpWireframeText("") }, at(16, 16, 48, 48))
        }
    }

    /**
     * A `<Text>` whose content is only private-use-area glyphs — an icon font — is not
     * human-readable, so the text is nulled and the shell kept.
     */
    @Test
    fun iconGlyphNulled() = golden("rn_icon_glyph_nulled") { ctx ->
        frame(ctx) { addView(text(ctx, ""), at(16, 16, 48, 48)) }
    }

    /** Mixed glyph + real words stays: only glyph-*only* text is dropped. */
    @Test
    fun iconGlyphMixedKept() = golden("rn_icon_glyph_mixed_kept") { ctx ->
        frame(ctx) { addView(text(ctx, " Cart"), at(16, 16, 160, 24)) }
    }

    // ==== IMAGE =========================================================================

    @Test
    fun imageUnlabeled() = golden("rn_image_unlabeled") { ctx ->
        frame(ctx) { addView(image(ctx), at(16, 16, 64, 64)) }
    }

    @Test
    fun imageAutoMasked() {
        SensitiveViewManager.autoMaskedViews = setOf(AutoMaskedView.Image)
        golden("rn_image_auto_masked") { ctx ->
            frame(ctx) { addView(image(ctx), at(16, 16, 64, 64)) }
        }
    }

    /** An `accessibilityLabel` prop names an otherwise textless image. */
    @Test
    fun imageLabel() = golden("rn_image_label") { ctx ->
        frame(ctx) { addView(labelled(image(ctx), "profile photo"), at(16, 16, 64, 64)) }
    }

    /** With the fallback off — the shipped default — the same image is a bare shell. */
    @Test
    fun imageLabelFallbackOff() {
        SensitiveViewManager.useAccessibilityLabelFallback = false
        golden("rn_image_label_fallback_off") { ctx ->
            frame(ctx) { addView(labelled(image(ctx), "profile photo"), at(16, 16, 64, 64)) }
        }
    }

    /** Masking beats the label: a masked image is never named. */
    @Test
    fun imageMaskedDropsLabel() = golden("rn_image_masked_drops_label") { ctx ->
        frame(ctx) {
            addView(
                labelled(image(ctx), "profile photo").apply { mpReplaySensitive(true) },
                at(16, 16, 64, 64)
            )
        }
    }

    // ==== INPUT =========================================================================

    /** A `<TextInput>` is always masked and its value is never scraped. */
    @Test
    fun inputAlwaysMasked() = golden("rn_input_always_masked") { ctx ->
        frame(ctx) { addView(input(ctx, "4111 1111 1111 1111"), at(16, 24, 280, 40)) }
    }

    /** An unmask cannot re-expose an input — the one decision nothing overrides. */
    @Test
    fun inputInUnmaskStillMasked() = golden("rn_input_in_unmask_still_masked") { ctx ->
        frame(ctx) {
            addView(
                ReactViewGroup(ctx).apply {
                    mpReplaySensitive(false)
                    addReactChild(input(ctx, "4111 1111 1111 1111"), 8, 8, 264, 40)
                },
                at(0, 0, 300, 60)
            )
        }
    }

    // ==== TOUCHABLE: React Native has no `button` role, on either platform ===============

    /**
     * `<Pressable>`/`<TouchableOpacity>` is a plain container and the `<Text>` inside carries
     * the label. Deliberate, and identical on iOS: adding a role on one platform only would
     * create a parity gap. This golden is what would catch that changing.
     */
    @Test
    fun touchableIsContainerNotButton() = golden("rn_touchable_is_container") { ctx ->
        frame(ctx) {
            addView(
                ReactViewGroup(ctx).apply { addReactChild(text(ctx, "Log in"), 8, 8, 168, 28) },
                at(16, 16, 184, 44)
            )
        }
    }

    /**
     * An icon-only touchable cannot be named by its `accessibilityLabel`, on either platform.
     *
     * `<Pressable accessibilityLabel="Add to cart">` puts the label on the container, and a
     * container has no role, so it emits no element to hang the label on — while the `<Image>`
     * inside it, which *is* the element, has no label of its own. The result is a textless image
     * shell however `useAccessibilityLabelFallback` is set, which is why there is one case here
     * rather than an on/off pair: two identical goldens would look like they were testing
     * something. `wireframeText` on the touchable is the way to describe it — see
     * [declaredPlainView].
     *
     * The same shape behaves the same way on iOS, for the same structural reason (the label
     * lands on the component view, the element comes from the inner one), so this is a genuine
     * cross-platform property and not an Android quirk.
     */
    @Test
    fun touchableLabelNotNamed() = golden("rn_touchable_label_not_named") { ctx ->
        frame(ctx) {
            addView(
                labelled(ReactViewGroup(ctx), "Add to cart").apply {
                    addReactChild(image(ctx), 6, 6, 24, 24)
                },
                at(16, 16, 36, 36)
            )
        }
    }

    /** A masked touchable: structure described, label dropped. */
    @Test
    fun touchableMaskedDropsLabel() = golden("rn_touchable_masked_drops_label") { ctx ->
        frame(ctx) {
            addView(
                labelled(ReactViewGroup(ctx), "Add to cart").apply {
                    mpReplaySensitive(true)
                    addReactChild(text(ctx, "Add"), 6, 6, 60, 24)
                },
                at(16, 16, 72, 36)
            )
        }
    }

    // ==== ACCESSIBILITY ROLES ===========================================================

    /**
     * `<Pressable accessibilityRole="button">` reports a `button`, and the `<Text>` inside it
     * keeps emitting its own element with the label.
     *
     * Two elements, not one: a roled container does not become a wireframe leaf on Android, so
     * the child is still walked. iOS *does* close the subtree and therefore reports one element
     * carrying the label. Same markup, different shape, by capability.
     */
    @Test
    fun roleButton() = golden("rn_role_button") { ctx ->
        frame(ctx) {
            addView(
                roled(ReactViewGroup(ctx), "BUTTON").apply {
                    addReactChild(text(ctx, "Log in"), 8, 8, 168, 28)
                },
                at(16, 16, 184, 44)
            )
        }
    }

    /** The roles Android can read that iOS cannot — reported here, absent there, by design. */
    @Test
    fun roleLink() = golden("rn_role_link") { ctx ->
        frame(ctx) {
            addView(
                roled(ReactViewGroup(ctx), "LINK").apply {
                    addReactChild(text(ctx, "Terms of service"), 0, 0, 200, 20)
                },
                at(16, 16, 200, 20)
            )
        }
    }

    @Test
    fun roleHeader() = golden("rn_role_header") { ctx ->
        frame(ctx) {
            addView(
                roled(ReactViewGroup(ctx), "HEADER").apply {
                    addReactChild(text(ctx, "Your orders"), 0, 0, 200, 24)
                },
                at(16, 16, 200, 24)
            )
        }
    }

    @Test
    fun roleCheckbox() = golden("rn_role_checkbox") { ctx ->
        frame(ctx) {
            addView(
                roled(ReactViewGroup(ctx), "CHECKBOX").apply {
                    addReactChild(text(ctx, "Log in"), 8, 8, 240, 20)
                },
                at(0, 0, 280, 60)
            )
        }
    }

    @Test
    fun roleSwitch() = golden("rn_role_switch") { ctx ->
        frame(ctx) {
            addView(
                roled(ReactViewGroup(ctx), "SWITCH").apply {
                    addReactChild(text(ctx, "Log in"), 8, 8, 240, 20)
                },
                at(0, 0, 280, 60)
            )
        }
    }

    /**
     * A role outside the allowlist is ignored and the container stays unroled.
     *
     * React Native's enum has ~70 members; only the mapped ones may appear in the payload, so a
     * new upstream value can never reach it unreviewed.
     */
    @Test
    fun roleUnmappedIsIgnored() = golden("rn_role_unmapped_ignored") { ctx ->
        frame(ctx) {
            addView(
                roled(ReactViewGroup(ctx), "TREEGRID").apply {
                    addReactChild(text(ctx, "Log in"), 8, 8, 240, 20)
                },
                at(0, 0, 280, 60)
            )
        }
    }

    /**
     * A roled control wrapping masked content: the control is reported, the masked text is not.
     *
     * Taking a role must not become a way to launder masked content, because `role` is the one
     * field the masking pipeline never filters.
     */
    @Test
    fun roleWithMaskedDescendant() = golden("rn_role_masked_descendant") { ctx ->
        frame(ctx) {
            addView(
                roled(ReactViewGroup(ctx), "BUTTON").apply {
                    addReactChild(text(ctx, "Pay"), 8, 4, 60, 20)
                    addReactChild(
                        text(ctx, "4111 1111 1111 1111").apply { mpReplaySensitive(true) },
                        8, 28, 200, 20
                    )
                },
                at(16, 16, 240, 56)
            )
        }
    }

    /**
     * A nested control keeps its own element. This is the discipline Flutter's `ListTile` fusion
     * lacks, where the row's nested action disappears entirely.
     */
    @Test
    fun roleNestedControlKeptSeparate() = golden("rn_role_nested_control") { ctx ->
        frame(ctx) {
            addView(
                roled(ReactViewGroup(ctx), "BUTTON").apply {
                    addReactChild(text(ctx, "Cupcake"), 8, 4, 120, 20)
                    addReactChild(
                        roled(ReactViewGroup(ctx), "BUTTON").apply {
                            addReactChild(text(ctx, "Add"), 0, 0, 40, 20)
                        },
                        160, 4, 40, 20
                    )
                },
                at(16, 16, 240, 32)
            )
        }
    }

    // ==== DECLARED TEXT (`wireframeText`) ===============================================

    /** Describes content the SDK cannot read — a chart, a canvas. */
    @Test
    fun declaredPlainView() = golden("rn_declared_plain_view") { ctx ->
        frame(ctx) {
            addView(
                ReactViewGroup(ctx).apply { mpWireframeText("Monthly spend chart") },
                at(16, 16, 300, 120)
            )
        }
    }

    /** Names a field without ever revealing what was typed into it. */
    @Test
    fun declaredInput() = golden("rn_declared_input") { ctx ->
        frame(ctx) {
            addView(
                input(ctx, "4111 1111 1111 1111").apply { mpWireframeText("Card number") },
                at(16, 24, 280, 40)
            )
        }
    }

    /** Masking hides the pixels; the authored text still describes the view. */
    @Test
    fun declaredMaskImage() = golden("rn_declared_mask_image") { ctx ->
        frame(ctx) {
            addView(
                image(ctx).apply {
                    mpReplaySensitive(true)
                    mpWireframeText("profile photo")
                },
                at(16, 16, 64, 64)
            )
        }
    }

    /** A declared *container* has no role of its own, so its real content is still walked. */
    @Test
    fun declaredContainerKeepsInput() = golden("rn_declared_container_keeps_input") { ctx ->
        frame(ctx) {
            addView(
                ReactViewGroup(ctx).apply {
                    mpWireframeText("Checkout summary")
                    addReactChild(input(ctx, "4111"), 8, 8, 264, 40)
                },
                at(0, 0, 300, 60)
            )
        }
    }

    /** Declared text is exempt from the geometric strip — authored, not scraped. */
    @Test
    fun declaredSurvivesGeometric() = golden("rn_declared_survives_geometric") { ctx ->
        frame(ctx) {
            addView(
                ReactViewGroup(ctx).apply {
                    mpReplaySensitive(true)
                    addReactChild(
                        text(ctx, "Account 4021-8853").apply { mpWireframeText("Account") },
                        8, 8, 240, 20
                    )
                },
                at(0, 0, 300, 40)
            )
        }
    }

    /** Rules run last, over declared text too — the one thing that can still take it away. */
    @Test
    fun declaredRuleStripped() = golden("rn_declared_rule_stripped", rules = listOf(SensitiveRule.Strip("account"))) { ctx ->
        frame(ctx) {
            addView(
                ReactViewGroup(ctx).apply { mpWireframeText("Account summary") },
                at(16, 16, 300, 60)
            )
        }
    }

    /** Declared text is never gated by the label flag. */
    @Test
    fun declaredBeatsLabelFallbackOff() {
        SensitiveViewManager.useAccessibilityLabelFallback = false
        golden("rn_declared_beats_label_fallback_off") { ctx ->
            frame(ctx) {
                addView(
                    labelled(image(ctx), "ignored label").apply { mpWireframeText("profile photo") },
                    at(16, 16, 64, 64)
                )
            }
        }
    }

    /** Declared text outranks the view's own visible text. */
    @Test
    fun declaredBeatsVisibleText() = golden("rn_declared_beats_visible") { ctx ->
        frame(ctx) {
            addView(text(ctx, "scraped").apply { mpWireframeText("declared") }, at(16, 24, 200, 22))
        }
    }

    // ==== GEOMETRIC LEAK PREVENTION =====================================================

    /** A masked sibling painted over unmasked text: the text cannot ship. */
    @Test
    fun geometricOverlapNulled() = golden("rn_geometric_overlap_nulled") { ctx ->
        frame(ctx) {
            addView(text(ctx, "Account 4021-8853"), at(16, 24, 240, 22))
            addView(
                ReactViewGroup(ctx).apply { mpReplaySensitive(true) },
                at(16, 24, 240, 22)
            )
        }
    }

    /** Both a text and an image under the same mask rect. */
    @Test
    fun geometricOverlapTextAndImage() = golden("rn_geometric_overlap_text_and_image") { ctx ->
        frame(ctx) {
            addView(labelled(image(ctx), "profile photo"), at(16, 16, 40, 40))
            addView(text(ctx, "Ada Lovelace"), at(64, 16, 200, 24))
            addView(ReactViewGroup(ctx).apply { mpReplaySensitive(true) }, at(0, 0, 300, 56))
        }
    }

    /** A mask nested inside an unmask still masks. */
    @Test
    fun nestedMaskInUnmask() = golden("rn_nested_mask_in_unmask") { ctx ->
        frame(ctx) {
            addView(
                ReactViewGroup(ctx).apply {
                    mpReplaySensitive(false)
                    addReactChild(
                        text(ctx, "Account 4021-8853").apply { mpReplaySensitive(true) },
                        8, 8, 240, 20
                    )
                },
                at(0, 0, 300, 40)
            )
        }
    }

    /** An unmask nested inside a mask: the parent's rect still strips it geometrically. */
    @Test
    fun nestedUnmaskInMaskGeometric() = golden("rn_nested_unmask_in_mask_geometric") { ctx ->
        frame(ctx) {
            addView(
                ReactViewGroup(ctx).apply {
                    mpReplaySensitive(true)
                    addReactChild(
                        text(ctx, "Order total").apply { mpReplaySensitive(false) },
                        8, 8, 240, 20
                    )
                },
                at(0, 0, 300, 40)
            )
        }
    }

    /** An unmask under a plain layout that sits under a mask. */
    @Test
    fun nestedUnmaskUnderLayoutGeometric() = golden("rn_nested_unmask_under_layout_geometric") { ctx ->
        frame(ctx) {
            addView(
                ReactViewGroup(ctx).apply {
                    mpReplaySensitive(true)
                    addReactChild(
                        ReactViewGroup(ctx).apply {
                            addReactChild(
                                text(ctx, "Order total").apply { mpReplaySensitive(false) },
                                4, 4, 200, 20
                            )
                        },
                        8, 8, 240, 28
                    )
                },
                at(0, 0, 300, 48)
            )
        }
    }

    // ==== SENSITIVE RULES ===============================================================

    @Test
    fun ruleStrip() = golden("rn_rule_strip", rules = listOf(SensitiveRule.Strip("account"))) { ctx ->
        frame(ctx) {
            addView(text(ctx, "Account 4021-8853"), at(16, 24, 300, 22))
            addView(text(ctx, "Order total"), at(16, 56, 300, 22))
        }
    }

    @Test
    fun ruleStripRegex() = golden("rn_rule_strip_regex", rules = listOf(SensitiveRule.StripRegex(Regex("\\d{4}-\\d{4}")))) { ctx ->
        frame(ctx) {
            addView(text(ctx, "Account 4021-8853"), at(16, 24, 300, 22))
            addView(text(ctx, "Order total"), at(16, 56, 300, 22))
        }
    }

    @Test
    fun ruleRedact() = golden("rn_rule_redact", rules = listOf(SensitiveRule.Redact("ada", "[NAME]"))) { ctx ->
        frame(ctx) {
            addView(text(ctx, "Receipt sent to Ada"), at(16, 24, 300, 22))
        }
    }

    @Test
    fun ruleRedactRegex() = golden("rn_rule_redact_regex", rules = listOf(SensitiveRule.RedactRegex(Regex("[^@\\s]+@[^@\\s]+"), "[EMAIL]"))) { ctx ->
        frame(ctx) {
            addView(text(ctx, "Receipt sent to ada@example.com"), at(16, 24, 340, 22))
        }
    }

    /** Rules apply to a label-derived text too, not just to scraped visible text. */
    @Test
    fun ruleRedactImageLabel() = golden("rn_rule_redact_image_label", rules = listOf(SensitiveRule.Redact("ada", "[NAME]"))) { ctx ->
        frame(ctx) { addView(labelled(image(ctx), "ada portrait"), at(16, 16, 64, 64)) }
    }

    // ==== THE CLASS API: how the bridge masks React Native's own views ==================

    /**
     * `addSensitiveClass` is exactly how the React Native bridge implements `autoMaskedViews`
     * for RN's view classes, so this is the path a real integration takes rather than an
     * exotic API. Reports EXPLICIT: a registered class is a developer opt-in.
     */
    @Test
    fun classExplicitMasked() {
        SensitiveViewManager.addSensitiveClass(ReactTextView::class.java)
        golden("rn_class_explicit_masked") { ctx ->
            frame(ctx) { addView(text(ctx, "Account 4021-8853"), at(16, 24, 300, 22)) }
        }
    }

    /** An unmask still overrides a class match. */
    @Test
    fun classSafeKept() {
        SensitiveViewManager.addSensitiveClass(ReactTextView::class.java)
        golden("rn_class_safe_kept") { ctx ->
            frame(ctx) {
                addView(
                    text(ctx, "Public notice").apply { mpReplaySensitive(false) },
                    at(16, 24, 240, 22)
                )
            }
        }
    }

    // ==== STRUCTURE AND VISIBILITY ======================================================

    /** No content: an empty element list, not a missing event. */
    @Test
    fun emptyScreen() = golden("rn_empty_screen") { ctx -> frame(ctx) {} }

    /** `display: none` contributes nothing, and neither do its children. */
    @Test
    fun hiddenViewsNotEmitted() = golden("rn_hidden_views_not_emitted") { ctx ->
        frame(ctx) {
            addView(
                ReactViewGroup(ctx).apply {
                    visibility = View.GONE
                    addReactChild(text(ctx, "Hidden"), 0, 0, 200, 20)
                },
                at(0, 0, 200, 20)
            )
        }
    }

    /** `opacity: 0` paints nothing, so nothing under it may reach the wireframe. */
    @Test
    fun transparentSubtreeDropped() = golden("rn_transparent_subtree_dropped") { ctx ->
        frame(ctx) {
            addView(
                ReactViewGroup(ctx).apply {
                    alpha = 0f
                    addReactChild(text(ctx, "Invisible"), 0, 0, 200, 20)
                },
                at(0, 0, 200, 20)
            )
        }
    }

    /**
     * The control for the two cases above. An empty golden is only evidence of suppression if
     * the same tree is non-empty when nothing suppresses it — without this, `"elements": []` is
     * indistinguishable from a child that was never laid out, which is exactly the bug that
     * produced this suite's first two vacuous goldens.
     */
    @Test
    fun visibleSubtreeControl() = golden("rn_visible_subtree_control") { ctx ->
        frame(ctx) {
            addView(
                ReactViewGroup(ctx).apply { addReactChild(text(ctx, "Visible"), 0, 0, 200, 20) },
                at(0, 0, 200, 20)
            )
        }
    }

    /** Overlapping siblings: both described, order stable, neither swallowing the other. */
    @Test
    fun overlappingSiblings() = golden("rn_overlapping_siblings") { ctx ->
        frame(ctx) {
            addView(text(ctx, "Behind"), at(16, 16, 200, 40))
            addView(text(ctx, "In front"), at(32, 32, 200, 40))
        }
    }

    /**
     * A masked container describes its *structure* rather than disappearing: children ship as
     * textless shells so the shape of the screen survives. Existence and position are not
     * customer content; the text is what must not escape.
     */
    @Test
    fun maskedContainerDescribesStructure() = golden("rn_masked_container_describes_structure") { ctx ->
        frame(ctx) {
            addView(
                ReactViewGroup(ctx).apply {
                    mpReplaySensitive(true)
                    addReactChild(text(ctx, "Name"), 8, 4, 120, 20)
                    addReactChild(text(ctx, "Ada Lovelace"), 8, 28, 200, 20)
                    addReactChild(image(ctx), 220, 4, 40, 40)
                },
                at(0, 0, 300, 56)
            )
        }
    }

    /**
     * Content positioned outside the visible window is not emitted — the case a long
     * `FlatList` produces, where rows exist in the tree below the fold.
     *
     * This pins offscreen *clipping*, not scrolling. An earlier version set `scrollY` on a
     * `ScrollView` and asserted the scrolled-away row was gone; it was not — layoutlib runs a
     * single layout pass and the scroll never took effect, so the golden recorded both rows at
     * their unscrolled positions and passed anyway. Scroll offset is not reproducible
     * off-device, so the case tests the property that is: a row below the viewport is dropped
     * while the one inside it ships, at real coordinates.
     */
    @Test
    fun offscreenContentNotEmitted() = golden("rn_offscreen_content_not_emitted") { ctx ->
        frame(ctx) {
            addView(text(ctx, "Row in view"), at(16, 100, 240, 40))
            // Below PIXEL_5's 2340px height, so outside the window the walk measures against.
            addView(text(ctx, "Row below the fold"), at(16, 2600, 240, 40))
        }
    }

    /** Everything at once: the integration case each platform's suite ends with. */
    @Test
    fun complexMixedMasking() = golden(
        "rn_complex_mixed_masking",
        rules = listOf(SensitiveRule.RedactRegex(Regex("[^@\\s]+@[^@\\s]+"), "[EMAIL]"))
    ) { ctx ->
        frame(ctx) {
            addView(text(ctx, "Checkout"), at(16, 16, 200, 24))
            addView(labelled(image(ctx), "profile photo"), at(16, 56, 40, 40))
            addView(input(ctx, "4111 1111 1111 1111").apply { mpWireframeText("Card number") }, at(16, 112, 280, 40))
            addView(
                ReactViewGroup(ctx).apply {
                    mpReplaySensitive(true)
                    addReactChild(text(ctx, "Account 4021-8853"), 8, 4, 240, 20)
                },
                at(16, 164, 280, 28)
            )
            addView(text(ctx, "Receipt sent to ada@example.com"), at(16, 208, 300, 22))
            addView(
                ReactViewGroup(ctx).apply { addReactChild(text(ctx, "Place order"), 8, 8, 160, 24) },
                at(16, 244, 176, 40)
            )
        }
    }
}
