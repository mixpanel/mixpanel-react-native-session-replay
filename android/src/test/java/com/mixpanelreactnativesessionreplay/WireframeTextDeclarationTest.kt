package com.mixpanelreactnativesessionreplay

import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

class WireframeTextDeclarationTest {
    @Before
    fun setUp() {
        WireframeTextDeclarationRegistry.clearForTests()
    }

    @After
    fun tearDown() {
        WireframeTextDeclarationRegistry.clearForTests()
    }

    @Test
    fun `reapplies unchanged text after native registry reset`() {
        val appliedValues = mutableListOf<String?>()
        val declaration = WireframeTextDeclaration(appliedValues::add)

        declaration.update("Checkout")
        WireframeTextDeclarationRegistry.reapplyAll()

        assertEquals(listOf("Checkout", "Checkout"), appliedValues)
    }

    @Test
    fun `does not reapply a cleared declaration`() {
        val appliedValues = mutableListOf<String?>()
        val declaration = WireframeTextDeclaration(appliedValues::add)

        declaration.update("Checkout")
        declaration.update(null)
        WireframeTextDeclarationRegistry.reapplyAll()

        assertEquals(listOf("Checkout", null), appliedValues)
    }
}
