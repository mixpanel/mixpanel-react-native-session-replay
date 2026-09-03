package com.mixpanelreactnativesessionreplay.goldens

import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import com.facebook.react.views.image.ReactImageView
import com.facebook.react.views.text.ReactTextView
import com.facebook.react.views.textinput.ReactEditText
import com.facebook.react.views.view.ReactViewGroup
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The inheritance React Native's Android views must keep for the SDK to classify them.
 *
 * The SDK's Android walk classifies by framework superclass — `EditText` -> `input`,
 * `ImageView` -> `image`, `Button` -> `button`, `TextView` -> `text`, everything else a
 * container. That is *why* React Native needed no Android-specific code at all, and it is a
 * standing assumption about someone else's library. If a React Native upgrade re-parented one of
 * these, wireframes for every RN app on Android would change shape with no other test noticing.
 *
 * This is where `ReactEditText` is covered. It cannot be rendered off-device — its constructor
 * casts its `Context` to `ThemedReactContext`, which needs a live React instance — so
 * [ReactNativeWireframeGoldenTest] cannot include it. The class relationship is the part that
 * carries the risk, and it needs no instance to assert.
 */
class ReactNativeViewContractTest {

    @Test
    fun reactTextViewIsATextView() {
        assertTrue(
            "ReactTextView must remain a TextView, or RN text stops being classified at all",
            TextView::class.java.isAssignableFrom(ReactTextView::class.java)
        )
    }

    @Test
    fun reactEditTextIsAnEditText() {
        assertTrue(
            "ReactEditText must remain an EditText, or RN inputs stop being always-masked",
            EditText::class.java.isAssignableFrom(ReactEditText::class.java)
        )
    }

    @Test
    fun reactImageViewIsAnImageView() {
        assertTrue(
            "ReactImageView must remain an ImageView, or RN images stop being classified",
            ImageView::class.java.isAssignableFrom(ReactImageView::class.java)
        )
    }

    /**
     * The touchable container must *not* be a `TextView` or a `Button`. React Native emits no
     * `button` role on either platform — a `<Pressable>` is a plain container and the `<Text>`
     * inside it carries the label — which is what keeps iOS and Android wireframes comparable.
     */
    @Test
    fun reactViewGroupIsNeitherTextNorButton() {
        assertFalse(
            "a <View> must not classify as text",
            TextView::class.java.isAssignableFrom(ReactViewGroup::class.java)
        )
        assertFalse(
            "a <View> must not classify as an image",
            ImageView::class.java.isAssignableFrom(ReactViewGroup::class.java)
        )
    }
}
