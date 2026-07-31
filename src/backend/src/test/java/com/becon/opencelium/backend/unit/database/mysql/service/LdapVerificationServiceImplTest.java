/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.configuration.LdapProperties;
import com.becon.opencelium.backend.database.mysql.service.LdapVerificationServiceImpl;
import com.becon.opencelium.backend.resource.LdapConfigDTO;
import com.becon.opencelium.backend.resource.LdapVerificationMessageDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the network-free branches of {@link LdapVerificationServiceImpl}.
 *
 * Every other public/private path opens a real {@code DirContext} or
 * {@code LdapTemplate}, so meaningful coverage lives in
 * {@code LdapVerificationServiceImplSliceTest} against an embedded UnboundID
 * server. This class only pins the two branches that never reach for the
 * network: the {@code OFF} log gate and the null-timeout guard.
 */
@ExtendWith(MockitoExtension.class)
class LdapVerificationServiceImplTest {

    @Mock
    private LdapProperties properties;

    // ── validateAndLog ────────────────────────────────────────────────────────

    @Test
    void validateAndLogReturnsEarlyWhenShowLogsContainsOff() {
        when(properties.isShowLogs()).thenReturn("OFF");
        LdapVerificationServiceImpl service = new LdapVerificationServiceImpl(properties);

        service.validateAndLog("alice", "alicepw");

        // The OFF gate is the very first thing the method does — no other
        // properties getter should be touched, and no network call attempted.
        verify(properties).isShowLogs();
        verifyNoMoreInteractions(properties);
    }

    // ── collectMessages ───────────────────────────────────────────────────────

    @Test
    void collectMessagesReturnsTimeoutErrorWhenTimeoutIsNull() {
        LdapVerificationServiceImpl service = new LdapVerificationServiceImpl(properties);
        LdapConfigDTO config = new LdapConfigDTO();
        config.setTimeout(null);

        List<LdapVerificationMessageDTO> result = service.collectMessages(config);

        // The timeout guard short-circuits before any other step runs, so
        // the list contains exactly the one error message — no Host, no
        // User credentials, no STATUS CODE.
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Timeout");
        assertThat(result.get(0).getText())
                .isEqualTo("'timeout' in Ldap configuration should be not null");
    }
}
