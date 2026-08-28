package com.mixpanelreactnativesessionreplay.goldens

import com.mixpanel.android.sessionreplay.wireframe.WireframeElement
import org.junit.Assert.assertEquals
import java.io.File

/**
 * Golden ("snapshot") assertion for the `mp_wireframe` element list.
 *
 * The serialized **format** is byte-for-byte identical to the Android SDK's own golden harness
 * and to the Flutter and iOS suites, so a reviewer can eyeball cross-platform parity. Only the
 * coordinates differ per platform, which is why the files are not shared:
 *  - 2-space indent, arrays expanded one value per line
 *  - key order: `role`, `text`, `bounds`, `maskDecision`
 *  - `text` is the JSON literal `null` when the element carries no text
 *  - no trailing newline
 *  - byte-exact string comparison
 *
 * Unlike the instrumented harness this runs on the JVM with the host source tree writable, so a
 * missing golden is **auto-created** (written, announced, passes) exactly as the Robolectric
 * harness does — authoring a new case is a single run.
 *
 * Coordinates here come from layoutlib rather than a device, so they are pinned by the
 * `DeviceConfig` each test declares, not by whatever emulator happened to be attached.
 */
internal object WireframeGoldenFormat {

    private const val GOLDEN_RELATIVE_PATH = "src/test/golden/wireframe"

    private val goldenDir: File
        get() = File(File(System.getProperty("user.dir") ?: "."), GOLDEN_RELATIVE_PATH)

    /**
     * Asserts the element list, and the mask rectangles alongside it in `<name>.masks.json`.
     *
     * The companion file exists because masking is otherwise invisible in cases where there was
     * no text to remove — a masked, unlabelled image produces the same element as an unmasked
     * one. Same shape as the iOS SDK's `.masks.json` files.
     */
    fun assertGolden(capture: ReactNativePaparazziHarness.Capture, golden: String) {
        assertText(maskGoldenJson(capture.maskFrames), golden.removeSuffix(".json") + ".masks.json")
        val actual = wireframeGoldenJson(capture.viewport, capture.elements)
        assertText(actual, golden)
    }

    private fun assertText(actual: String, golden: String) {
        val file = File(goldenDir, golden)
        if (!file.exists()) {
            file.parentFile?.mkdirs()
            file.writeText(actual)
            println("📸 Created wireframe golden: $golden -> ${file.absolutePath}")
            return
        }
        assertEquals(
            "Wireframe golden mismatch for $golden.\n" +
                "If this change is intended, delete ${file.path} and re-run to regenerate.",
            file.readText(),
            actual
        )
    }

    private fun maskGoldenJson(frames: List<android.graphics.Rect>): String {
        if (frames.isEmpty()) return "{\n  \"maskFrames\": []\n}"
        val sb = StringBuilder("{\n  \"maskFrames\": [\n")
        frames.forEachIndexed { i, rect ->
            sb.append("    { \"bounds\": [")
                .append(rect.left).append(", ").append(rect.top).append(", ")
                .append(rect.width()).append(", ").append(rect.height())
                .append("] }")
                .append(if (i == frames.lastIndex) "\n" else ",\n")
        }
        sb.append("  ]\n}")
        return sb.toString()
    }

    // ---- Serialization (byte-compatible with the other Android harnesses + Flutter/iOS) --------

    private fun wireframeGoldenJson(viewport: List<Int>, elements: List<WireframeElement>): String {
        val sb = StringBuilder()
        sb.append("{\n")
        sb.append("  \"viewport\": [\n")
        viewport.forEachIndexed { i, v ->
            sb.append("    ").append(v).append(if (i == viewport.lastIndex) "\n" else ",\n")
        }
        sb.append("  ],\n")
        if (elements.isEmpty()) {
            sb.append("  \"elements\": []\n")
        } else {
            sb.append("  \"elements\": [\n")
            elements.forEachIndexed { index, e ->
                appendElement(sb, e)
                sb.append(if (index == elements.lastIndex) "    }\n" else "    },\n")
            }
            sb.append("  ]\n")
        }
        sb.append("}")
        return sb.toString()
    }

    private fun appendElement(sb: StringBuilder, e: WireframeElement) {
        sb.append("    {\n")
        sb.append("      \"role\": ").append(jsonString(e.type.wireName())).append(",\n")
        sb.append("      \"text\": ").append(e.text?.let(::jsonString) ?: "null").append(",\n")
        sb.append("      \"bounds\": [\n")
        sb.append("        ").append(e.x).append(",\n")
        sb.append("        ").append(e.y).append(",\n")
        sb.append("        ").append(e.w).append(",\n")
        sb.append("        ").append(e.h).append("\n")
        sb.append("      ],\n")
        sb.append("      \"maskDecision\": ").append(jsonString(e.maskDecision.name)).append("\n")
    }

    private fun jsonString(s: String): String {
        val sb = StringBuilder(s.length + 2)
        sb.append('"')
        for (ch in s) {
            when (ch) {
                '"' -> sb.append("\\\"")
                '\\' -> sb.append("\\\\")
                '\n' -> sb.append("\\n")
                '\r' -> sb.append("\\r")
                '\t' -> sb.append("\\t")
                else -> if (ch.code < 0x20) sb.append("\\u%04x".format(ch.code)) else sb.append(ch)
            }
        }
        sb.append('"')
        return sb.toString()
    }
}
