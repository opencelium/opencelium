/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.slice.database.mysql.service;

import com.becon.opencelium.backend.configuration.LdapProperties;
import com.becon.opencelium.backend.database.mysql.service.LdapVerificationServiceImpl;
import com.becon.opencelium.backend.resource.LdapConfigDTO;
import com.becon.opencelium.backend.resource.LdapVerificationMessageDTO;
import com.becon.opencelium.backend.testutil.LdapTestServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Slice tests for {@link LdapVerificationServiceImpl} backed by an in-process
 * UnboundID LDAP server.
 *
 * The server is started once for the class ({@code @BeforeAll}) because each
 * test is read-only against it. Both public methods are exercised against
 * real LDAP traffic so every private helper — {@code checkHost},
 * {@code checkAdminCredentials}, {@code countUsers}, {@code validateLoginPrincipal},
 * {@code validateLoginCredential}, {@code createLdapTemplate} — runs end-to-end.
 *
 * Suffix is {@code *Test} (not {@code *IT}) because UnboundID runs in-process:
 * no Docker, executes under the {@code test} Gradle task.
 */
@ExtendWith(MockitoExtension.class)
class LdapVerificationServiceImplSliceTest {

    private static LdapTestServer server;

    @Mock
    private LdapProperties properties;

    private LdapVerificationServiceImpl service;

    @BeforeAll
    static void startServer() throws Exception {
        server = LdapTestServer.start();
    }

    @AfterAll
    static void stopServer() {
        if (server != null) {
            server.stop();
        }
    }

    @BeforeEach
    void setUp() {
        service = new LdapVerificationServiceImpl(properties);
    }

    // ── collectMessages ───────────────────────────────────────────────────────

    @Test
    void collectMessagesCountsUsersUnderUserDnWhenConfigValid() {
        List<LdapVerificationMessageDTO> result = service.collectMessages(server.validConfig());

        // Happy path emits four messages in order: Host → User credentials →
        // Found entries → STATUS CODE. This single test pins the "always
        // appends STATUS CODE on success" contract.
        assertThat(result).extracting(LdapVerificationMessageDTO::getTitle)
                .containsExactly("Host", "User credentials", "Found entries", "STATUS CODE");
        assertThat(result.get(2).getText())
                .contains("Found " + LdapTestServer.SEEDED_USER_COUNT + " users")
                .contains(LdapTestServer.USER_DN);
        // Admin password must never appear in the message — even on success.
        assertThat(result.get(1).getText()).contains("[PROTECTED]")
                .doesNotContain(LdapTestServer.ADMIN_PASSWORD);
    }

    @Test
    void collectMessagesStopsAtHostFailureWhenUrlUnreachable() {
        LdapConfigDTO config = server.validConfig();
        // Port 1 is reserved/closed → JNDI fails connect inside the short timeout.
        config.setUrls("ldap://localhost:1");
        config.setTimeout("500");

        List<LdapVerificationMessageDTO> result = service.collectMessages(config);

        // Catch fires before the Host entry is appended, so the list contains
        // exactly one message — the failing-step title plus its error text.
        // This pins both "stops at first failure" and "failing title is reported".
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Host");
        assertThat(result.get(0).getText()).contains("is not reachable");
    }

    @Test
    void collectMessagesReturnsBadAdminCredentialsWhenBindFails() {
        LdapConfigDTO config = server.validConfig();
        config.setPassword("wrong");

        List<LdapVerificationMessageDTO> result = service.collectMessages(config);

        // Host succeeds and is appended; User credentials fails and lands as
        // the second (last) entry — no Found entries, no STATUS CODE.
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getTitle()).isEqualTo("Host");
        assertThat(result.get(1).getTitle()).isEqualTo("User credentials");
        assertThat(result.get(1).getText()).contains("does not have access");
        // The wrong password is masked even in the failure message.
        assertThat(result.get(1).getText()).contains("[PROTECTED]")
                .doesNotContain("wrong");
    }

    @Test
    void collectMessagesReturnsCouldNotCountWhenUserDnDoesNotExist() {
        LdapConfigDTO config = server.validConfig();
        config.setUserDN("ou=ghosts," + LdapTestServer.BASE_DN);

        List<LdapVerificationMessageDTO> result = service.collectMessages(config);

        // Host + User credentials succeed; countUsers throws NameNotFoundException
        // and the catch turns it into the "Found entries" failure entry.
        assertThat(result).hasSize(3);
        assertThat(result.get(2).getTitle()).isEqualTo("Found entries");
        assertThat(result.get(2).getText()).startsWith("Could not count users under userDN");
    }

    // ── validateAndLog ────────────────────────────────────────────────────────

    @Test
    void validateAndLogRunsAllStepsWhenShowLogsIsOn() {
        stubPropertiesFrom(server.validConfig(), "ON");

        // The contract is "swallow throwables, log results". A happy run
        // exercises every helper end-to-end; the only externally observable
        // post-condition is that the method returned normally.
        assertThatCode(() -> service.validateAndLog("alice", LdapTestServer.ALICE_PASSWORD))
                .doesNotThrowAnyException();
    }

    @Test
    void validateAndLogDoesNotPropagateExceptionWhenStepFails() {
        LdapConfigDTO bad = server.validConfig();
        bad.setUrls("ldap://localhost:1");
        bad.setTimeout("500");
        stubPropertiesFrom(bad, "ON");

        // checkHost throws inside the try, the catch swallows it. If this
        // ever leaks a throwable into the auth filter, login flows die —
        // this assertion is the early-warning for that regression.
        assertThatCode(() -> service.validateAndLog("alice", "alicepw"))
                .doesNotThrowAnyException();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /**
     * Stub every getter that {@code validateAndLog} reads. {@code lenient()}
     * because the failing-step path bails out early and leaves some stubs
     * unused, which would otherwise trip {@code STRICT_STUBS}.
     */
    private void stubPropertiesFrom(LdapConfigDTO config, String showLogs) {
        lenient().when(properties.isShowLogs()).thenReturn(showLogs);
        lenient().when(properties.getUrls()).thenReturn(config.getUrls());
        lenient().when(properties.getUserSearchBase()).thenReturn(config.getUserDN());
        lenient().when(properties.getGroupSearchBase()).thenReturn(config.getGroupDN());
        lenient().when(properties.getUsername()).thenReturn(config.getUsername());
        lenient().when(properties.getPassword()).thenReturn(config.getPassword());
        lenient().when(properties.getTimeout()).thenReturn(config.getTimeout());
        lenient().when(properties.getUserSearchFilter()).thenReturn(config.getUserSearchFilter());
        lenient().when(properties.getGroupSearchFilter()).thenReturn(config.getGroupSearchFilter());
    }
}
