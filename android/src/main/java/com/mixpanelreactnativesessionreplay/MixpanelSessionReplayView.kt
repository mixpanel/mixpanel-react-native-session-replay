package com.mixpanelreactnativesessionreplay

import android.content.Context
import android.view.View
import android.view.ViewGroup
import com.facebook.react.views.view.ReactViewGroup
import com.mixpanel.android.sessionreplay.MPSessionReplay
import com.mixpanel.android.sessionreplay.MPSessionReplayInstance

class MixpanelSessionReplayView(context: Context) : ReactViewGroup(context) {
  private var sensitive: Boolean = false
  private var shouldMarkChildrenSafe: Boolean = false // Track if we need to mark future children safe

  fun setSensitive(sensitive: Boolean) {
    this.sensitive = sensitive
    updateSensitivity()
  }

  private fun updateSensitivity() {
    // log the sensitivity change
    println("MixpanelSessionReplayView - updateSensitivity called with value: $sensitive for view: $this")
    val sessionReplay = MPSessionReplay.getInstance()
    if (sessionReplay != null) {
      if (sensitive) {
        sessionReplay.addSensitiveView(this)
      } else {
        sessionReplay.addSafeView(this)
      }
    }
  }

  private fun markAllChildrenAsSafe() {
    val sessionReplay = MPSessionReplay.getInstance()
    if (sessionReplay != null) {
      markViewAndChildrenAsSafeRecursively(this, sessionReplay, 0)
    }
  }

  private fun markViewAndChildrenAsSafeRecursively(view: View?, sessionReplay: MPSessionReplayInstance, depth: Int) {
    // Prevent infinite recursion by limiting depth
    if (depth > 50) {
      println("MixpanelSessionReplayView: Recursion depth limit reached, stopping traversal")
      return
    }

    if (view == null) {
      return
    }

    try {
      sessionReplay.addSafeView(view)

      if (view is android.view.ViewGroup) {
        // log that we found a view group
        println("MixpanelSessionReplayView: Found ViewGroup: $view at depth $depth with child count: ${view.childCount}")
        for (i in 0 until view.childCount) {
          val child = view.getChildAt(i)

          // Override nested MixpanelSessionReplayView components
          if (child is MixpanelSessionReplayView) {
            // log the override
            println("MixpanelSessionReplayView: Marking child view as safe: $child")
            sessionReplay.addSafeView(child) // Mark as safe
          }

          // Continue recursion for all children
          markViewAndChildrenAsSafeRecursively(child, sessionReplay, depth + 1)
        }
      } else {
        // log that we found a regular view
        println("MixpanelSessionReplayView: Found View: $view at depth $depth")
      }
    } catch (e: Exception) {
      println("MixpanelSessionReplayView: Error marking view as safe: ${e.message}")
    }
  }

  fun markOnlyDirectChildrenAsSafe() {
    val sessionReplay = MPSessionReplay.getInstance()
    if (sessionReplay != null) {
      println("MixpanelSessionReplayView: markOnlyDirectChildrenAsSafe called - childCount: $childCount")
      
      // Only process direct children, with strict boundary checks
      for (i in 0 until childCount) {
        val child = getChildAt(i)
        
        // Verify this child actually belongs to us
        if (child != null && child.parent == this) {
          try {
            sessionReplay.addSafeView(child)
            println("MixpanelSessionReplayView: Successfully marked direct child as safe: $child")
            
            // Only handle nested MixpanelSessionReplayView components, don't recurse into regular views
            if (child is MixpanelSessionReplayView) {
              println("MixpanelSessionReplayView: Found nested MixpanelSessionReplayView, overriding its state")
              child.setSensitive(false)
            }
          } catch (e: Exception) {
            println("MixpanelSessionReplayView: Error marking direct child as safe: ${e.message}")
          }
        }
      }
    }
  }
}
