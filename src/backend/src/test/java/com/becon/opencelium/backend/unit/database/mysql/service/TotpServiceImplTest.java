/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Session;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.service.SessionService;
import com.becon.opencelium.backend.database.mysql.service.TotpServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserService;
import com.becon.opencelium.backend.resource.user.TotpResource;
import com.becon.opencelium.backend.testutil.fixture.SessionFixture;
import com.becon.opencelium.backend.testutil.fixture.UserFixture;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link TotpServiceImpl}.
 *
 * The {@link GoogleAuthenticator} provider is injected via the package-private
 * constructor so {@code createCredentials} and {@code authorize} can be
 * stubbed deterministically — both are final-class APIs and require
 * mockito-inline, which is on the test classpath.
 *
 * {@code getTotpResource} also exercises the bundled ZXing QR encoder; we
 * pin the contract by base64-decoding the returned data URI and confirming
 * it parses as a 300×300 PNG.
 */
@ExtendWith(MockitoExtension.class)
class TotpServiceImplTest {

    @Mock
    private UserService userService;

    @Mock
    private SessionService sessionService;

    @Mock
    private GoogleAuthenticator provider;

    private TotpServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new TotpServiceImpl(userService, sessionService, provider);
    }

    // ── getTotpResource ───────────────────────────────────────────────────────

    @Test
    void getTotpResourceReturnsResourceWithSessionIdAndSecretKeyWhenUserHasSession() {
        Session session = SessionFixture.aSessionWithId("session-abc", 7);
        User user = UserFixture.anEmptyUser();
        user.setId(7);
        user.setEmail("a@b.com");
        user.setSession(session);
        user.setTotpSecretKey("SECRET");

        TotpResource result = service.getTotpResource(user);

        assertThat(result.getSessionId()).isEqualTo("session-abc");
        assertThat(result.getSecretKey()).isEqualTo("SECRET");
    }

    @Test
    void getTotpResourceReturnsBase64PngDataUriWhenInvoked() throws Exception {
        Session session = SessionFixture.aSessionWithId("session-abc", 7);
        User user = UserFixture.anEmptyUser();
        user.setId(7);
        user.setEmail("a@b.com");
        user.setSession(session);
        user.setTotpSecretKey("SECRET");

        TotpResource result = service.getTotpResource(user);

        String qr = result.getQr();
        assertThat(qr).startsWith("data:image/png;base64,");

        byte[] decoded = Base64.getDecoder()
                .decode(qr.substring("data:image/png;base64,".length()));
        // PNG signature: 89 50 4E 47 0D 0A 1A 0A
        assertThat(decoded[0]).isEqualTo((byte) 0x89);
        assertThat(decoded[1]).isEqualTo((byte) 0x50);
        assertThat(decoded[2]).isEqualTo((byte) 0x4E);
        assertThat(decoded[3]).isEqualTo((byte) 0x47);

        // And it actually parses at the dimensions hard-coded in the service.
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(decoded));
        assertThat(image).isNotNull();
        assertThat(image.getWidth()).isEqualTo(300);
        assertThat(image.getHeight()).isEqualTo(300);
    }

    // ── totpAction ────────────────────────────────────────────────────────────

    @Test
    void totpActionEnablesTotpAndDeletesSessionWhenActionIsEnableAndSecretIsNull() {
        User user = UserFixture.anEmptyUser();
        user.setId(7);
        // totpSecretKey is null by default — the "enable" branch fires.
        when(userService.getById(7)).thenReturn(user);

        GoogleAuthenticatorKey key = mockKeyWithValue("FRESH-SECRET");
        when(provider.createCredentials()).thenReturn(key);

        service.totpAction(7, "enable");

        assertThat(user.getTotpSecretKey()).isEqualTo("FRESH-SECRET");
        // Existing session must be cleared so the user is forced to complete
        // the TOTP enrolment flow on next login.
        verify(sessionService).deleteByUserId(7);
    }

    @Test
    void totpActionIsNoOpWhenActionIsEnableAndSecretAlreadyPresent() {
        User user = UserFixture.anEmptyUser();
        user.setId(7);
        user.setTotpSecretKey("EXISTING-SECRET");
        when(userService.getById(7)).thenReturn(user);

        service.totpAction(7, "enable");

        // Secret untouched, no new credential created, no session torn down.
        assertThat(user.getTotpSecretKey()).isEqualTo("EXISTING-SECRET");
        verify(provider, never()).createCredentials();
        verifyNoInteractions(sessionService);
    }

    @Test
    void totpActionDisablesTotpAndClearsSecretWhenActionIsDisable() {
        User user = UserFixture.anEmptyUser();
        user.setId(7);
        user.setTotpSecretKey("SECRET");
        user.setTotpProcessCompleted(true);
        when(userService.getById(7)).thenReturn(user);

        service.totpAction(7, "disable");

        assertThat(user.getTotpSecretKey()).isNull();
        assertThat(user.isTotpProcessCompleted()).isFalse();
        // Disable doesn't tear down the session — it just rolls back TOTP state.
        verifyNoInteractions(sessionService);
    }

    @Test
    void totpActionThrowsRuntimeWhenActionIsUnknown() {
        User user = UserFixture.anEmptyUser();
        user.setId(7);
        when(userService.getById(7)).thenReturn(user);

        assertThatThrownBy(() -> service.totpAction(7, "toggle"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Wrong TOTP action");

        // No mutation, no provider/session calls on the unknown-action path.
        assertThat(user.getTotpSecretKey()).isNull();
        verifyNoInteractions(sessionService);
        verify(provider, never()).createCredentials();
    }

    @Test
    void totpActionThrowsWhenUserNotFound() {
        // Service propagates whatever UserService#getById raises.
        when(userService.getById(99)).thenThrow(new RuntimeException("USER_NOT_FOUND"));

        assertThatThrownBy(() -> service.totpAction(99, "enable"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("USER_NOT_FOUND");

        verifyNoInteractions(sessionService, provider);
    }

    // ── isValidTotp ───────────────────────────────────────────────────────────

    @Test
    void isValidTotpReturnsTrueWhenProviderAuthorizesCode() {
        when(provider.authorize("SECRET", 123456)).thenReturn(true);

        assertThat(service.isValidTotp("SECRET", "123456")).isTrue();
    }

    @Test
    void isValidTotpReturnsFalseWhenProviderRejectsCode() {
        when(provider.authorize("SECRET", 654321)).thenReturn(false);

        assertThat(service.isValidTotp("SECRET", "654321")).isFalse();
    }

    @Test
    void isValidTotpThrowsNumberFormatWhenCodeNonNumeric() {
        // Documents the current contract: the service does not pre-validate
        // the code shape — non-numeric input bubbles out as NumberFormatException
        // rather than a domain exception. Worth flagging if you'd like that
        // tightened upstream of the provider call.
        assertThatThrownBy(() -> service.isValidTotp("SECRET", "abc"))
                .isInstanceOf(NumberFormatException.class);

        verifyNoInteractions(provider);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static GoogleAuthenticatorKey mockKeyWithValue(String secret) {
        GoogleAuthenticatorKey key = org.mockito.Mockito.mock(GoogleAuthenticatorKey.class);
        when(key.getKey()).thenReturn(secret);
        return key;
    }
}
