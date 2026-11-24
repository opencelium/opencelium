/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.configuration;

import com.becon.opencelium.backend.configuration.SecurityConfiguration;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.repository.UserRepository;
import com.becon.opencelium.backend.database.mysql.service.LdapVerificationService;
import com.becon.opencelium.backend.database.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.enums.AuthMethod;
import com.becon.opencelium.backend.security.DaoUserDetailsService;
import com.becon.opencelium.backend.security.UserPrincipals;
import com.becon.opencelium.backend.testutil.fixture.UserFixture;
import com.becon.opencelium.backend.testutil.fixture.UserRoleFixture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ldap.core.DirContextAdapter;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.ldap.authentication.LdapAuthenticator;
import org.springframework.security.ldap.userdetails.LdapAuthoritiesPopulator;
import org.springframework.security.ldap.userdetails.LdapUserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for how {@link SecurityConfiguration} routes a password login between the LDAP and
 * the DAO provider.
 *
 * <p>The two providers come from the configuration itself and are chained in the same order as
 * its {@code authenticationManager} bean. Only the directory is replaced: a subclass returns a
 * mocked {@link LdapAuthenticator}, so a test can see whether the directory was asked at all. The
 * account lookup is the real {@link UserServiceImpl#findLocalAccount(String)} on a mocked
 * repository.
 */
@ExtendWith(MockitoExtension.class)
class SecurityConfigurationTest {

    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder(4);
    private static final String PASSWORD = "secret";

    @Mock
    UserRepository userRepository;

    @Mock
    LdapVerificationService ldapVerificationService;

    @Mock
    LdapAuthenticator ldapAuthenticator;

    @Mock
    LdapAuthoritiesPopulator ldapAuthoritiesPopulator;

    private AuthenticationManager authenticationManager;

    @BeforeEach
    void setUp() {
        UserServiceImpl userService = new UserServiceImpl();
        ReflectionTestUtils.setField(userService, "userRepository", userRepository);

        DaoUserDetailsService daoUserDetailsService = new DaoUserDetailsService();
        ReflectionTestUtils.setField(daoUserDetailsService, "userService", userService);

        SecurityConfiguration configuration = new SecurityConfiguration() {
            @Override
            public LdapAuthenticator ldapAuthenticator() {
                return ldapAuthenticator;
            }

            @Override
            public LdapAuthoritiesPopulator ldapAuthoritiesPopulator() {
                return ldapAuthoritiesPopulator;
            }
        };
        ReflectionTestUtils.setField(configuration, "bCryptPasswordEncoder", ENCODER);
        ReflectionTestUtils.setField(configuration, "daoUserDetailsService", daoUserDetailsService);
        ReflectionTestUtils.setField(configuration, "ldapVerificationService", ldapVerificationService);
        ReflectionTestUtils.setField(configuration, "userService", userService);

        authenticationManager = new ProviderManager(
                configuration.ldapAuthenticationProvider(), configuration.daoAuthenticationProvider());
    }

    @Test
    void authenticateChecksLocalPasswordWhenUsernameBelongsToOcAccount() {
        User local = anAccount("alice", AuthMethod.BASIC, ENCODER.encode(PASSWORD));
        storedUnderUsername("alice", local);

        Authentication result = authenticationManager.authenticate(login("alice", PASSWORD));

        assertThat(result.isAuthenticated()).isTrue();
        assertThat(result.getPrincipal()).isInstanceOf(UserPrincipals.class);
        assertThat(((UserPrincipals) result.getPrincipal()).getUser()).isSameAs(local);
    }

    @Test
    void authenticateChecksLocalPasswordWhenEmailBelongsToOcAccount() {
        User local = anAccount("alice", AuthMethod.BASIC, ENCODER.encode(PASSWORD));
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(local));

        Authentication result = authenticationManager.authenticate(login("alice@example.com", PASSWORD));

        assertThat(((UserPrincipals) result.getPrincipal()).getUser()).isSameAs(local);
    }

    @Test
    @DisplayName("authenticate — an OC account's password never reaches the directory, even when it is right")
    void authenticateSkipsDirectoryWhenIdentifierBelongsToOcAccount() {
        storedUnderUsername("alice", anAccount("alice", AuthMethod.BASIC, ENCODER.encode(PASSWORD)));

        authenticationManager.authenticate(login("alice", PASSWORD));

        verifyNoInteractions(ldapAuthenticator, ldapVerificationService);
    }

    @Test
    void authenticateRejectsWithoutDirectoryWhenOcPasswordIsWrong() {
        storedUnderUsername("alice", anAccount("alice", AuthMethod.BASIC, ENCODER.encode(PASSWORD)));

        assertThatThrownBy(() -> authenticationManager.authenticate(login("alice", "wrong")))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Bad credentials");

        verifyNoInteractions(ldapAuthenticator, ldapVerificationService);
    }

    @Test
    @DisplayName("authenticate — an unknown identifier goes to the directory, which is how LDAP users sign in first")
    void authenticateUsesDirectoryWhenIdentifierIsUnknown() {
        storedUnderUsername("bob", null);
        directoryAccepts("bob");

        Authentication result = authenticationManager.authenticate(login("bob", PASSWORD));

        assertThat(result.isAuthenticated()).isTrue();
        assertThat(result.getPrincipal()).isInstanceOf(LdapUserDetails.class);
        assertThat(((LdapUserDetails) result.getPrincipal()).getUsername()).isEqualTo("bob");
    }

    @Test
    @DisplayName("authenticate — a BASIC row without password is an LDAP user from before auth_method existed")
    void authenticateUsesDirectoryWhenBasicAccountHasNoPassword() {
        storedUnderUsername("legacy", anAccount("legacy", AuthMethod.BASIC, null));
        directoryAccepts("legacy");

        Authentication result = authenticationManager.authenticate(login("legacy", PASSWORD));

        assertThat(result.getPrincipal()).isInstanceOf(LdapUserDetails.class);
    }

    @Test
    @DisplayName("authenticate — a password stored in OC for an LDAP user does not let it in when the directory refuses")
    void authenticateRejectsLdapUserWhenOnlyOcStoredPasswordMatches() {
        storedUnderUsername("carol", anAccount("carol", AuthMethod.LDAP, ENCODER.encode(PASSWORD)));
        when(ldapAuthenticator.authenticate(any())).thenThrow(new BadCredentialsException("directory refused"));

        assertThatThrownBy(() -> authenticationManager.authenticate(login("carol", PASSWORD)))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Bad credentials");

        verify(ldapAuthenticator).authenticate(any());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private void storedUnderUsername(String username, User user) {
        when(userRepository.findByEmail(username)).thenReturn(Optional.empty());
        when(userRepository.findByUsername(username)).thenReturn(Optional.ofNullable(user));
    }

    private void directoryAccepts(String username) {
        when(ldapAuthenticator.authenticate(any()))
                .thenReturn(new DirContextAdapter("uid=" + username + ",ou=people,dc=example,dc=org"));
    }

    private static UsernamePasswordAuthenticationToken login(String identifier, String password) {
        return UsernamePasswordAuthenticationToken.unauthenticated(identifier, password);
    }

    private static User anAccount(String username, AuthMethod authMethod, String passwordHash) {
        User user = UserFixture.anEmptyUser();
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setAuthMethod(authMethod);
        user.setPassword(passwordHash);
        user.setUserRole(UserRoleFixture.aStandardUserRole());
        return user;
    }
}
