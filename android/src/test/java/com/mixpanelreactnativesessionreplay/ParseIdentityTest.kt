package com.mixpanelreactnativesessionreplay

import com.mixpanelreactnativesessionreplay.MixpanelReactNativeSessionReplayModule.Companion.parseIdentity
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ParseIdentityTest {
    @Test
    fun `reads the user, company and device ids`() {
        val identity = parseIdentity("""{"userId":"u","companyId":"acme","deviceId":"d"}""")!!

        assertEquals("u", identity.userId)
        assertEquals("acme", identity.companyId)
        assertEquals("d", identity.deviceId)
    }

    @Test
    fun `maps JSON null, empty and missing values to null`() {
        val identity = parseIdentity("""{"userId":"u","companyId":null,"deviceId":""}""")!!

        assertEquals("u", identity.userId)
        assertNull(identity.companyId)
        assertNull(identity.deviceId)
    }

    @Test
    fun `treats non-string ids as absent`() {
        val identity = parseIdentity("""{"userId":123,"companyId":45,"deviceId":"d"}""")!!

        assertNull(identity.userId)
        assertNull(identity.companyId)
        assertEquals("d", identity.deviceId)

        assertNull(parseIdentity("""{"userId":123,"deviceId":true}"""))
    }

    @Test
    fun `accepts a device-only identity`() {
        val identity = parseIdentity("""{"deviceId":"d"}""")!!

        assertNull(identity.userId)
        assertEquals("d", identity.deviceId)
    }

    @Test
    fun `rejects an identity with neither a user nor a device`() {
        assertNull(parseIdentity("""{"userId":null,"companyId":"acme","deviceId":null}"""))
        assertNull(parseIdentity("""{"userId":"","deviceId":""}"""))
        assertNull(parseIdentity("""{"companyId":"acme"}"""))
        assertNull(parseIdentity("{}"))
    }

    @Test
    fun `rejects an empty string and malformed JSON`() {
        assertNull(parseIdentity(""))
        assertNull(parseIdentity("null"))
        assertNull(parseIdentity("{\"userId\":"))
        assertNull(parseIdentity("[]"))
    }
}
