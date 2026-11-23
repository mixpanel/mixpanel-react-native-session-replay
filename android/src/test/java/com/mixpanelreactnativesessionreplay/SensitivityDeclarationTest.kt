package com.mixpanelreactnativesessionreplay

import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

class SensitivityDeclarationTest {
    @Before
    fun setUp() {
        SensitivityDeclarationRegistry.clearForTests()
    }

    @After
    fun tearDown() {
        SensitivityDeclarationRegistry.clearForTests()
    }

    @Test
    fun `applies false when it is the first value`() {
        val appliedValues = mutableListOf<Boolean>()
        val declaration = SensitivityDeclaration(appliedValues::add)

        declaration.update(false)

        assertEquals(listOf(false), appliedValues)
    }

    @Test
    fun `applies true when it is the first value`() {
        val appliedValues = mutableListOf<Boolean>()
        val declaration = SensitivityDeclaration(appliedValues::add)

        declaration.update(true)

        assertEquals(listOf(true), appliedValues)
    }

    @Test
    fun `applies only changes after the first value`() {
        val appliedValues = mutableListOf<Boolean>()
        val declaration = SensitivityDeclaration(appliedValues::add)

        declaration.update(true)
        declaration.update(true)
        declaration.update(false)

        assertEquals(listOf(true, false), appliedValues)
    }

    @Test
    fun `reapplies the current value after native registry reset`() {
        val appliedValues = mutableListOf<Boolean>()
        val declaration = SensitivityDeclaration(appliedValues::add)

        declaration.update(false)
        SensitivityDeclarationRegistry.reapplyAll()

        assertEquals(listOf(false, false), appliedValues)
    }

    @Test
    fun `does not reapply a declaration that never received a value`() {
        val appliedValues = mutableListOf<Boolean>()
        SensitivityDeclaration(appliedValues::add)

        SensitivityDeclarationRegistry.reapplyAll()

        assertEquals(emptyList<Boolean>(), appliedValues)
    }
}
