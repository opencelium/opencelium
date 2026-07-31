/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.repository.UserRepository;
import com.becon.opencelium.backend.database.mysql.repository.UserRoleRepository;
import com.becon.opencelium.backend.database.mysql.service.SessionServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserDetailServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.WidgetSettingServiceImp;
import com.becon.opencelium.backend.enums.AuthMethod;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.exception.ServiceUnavailableException;
import com.becon.opencelium.backend.resource.ChangePasswordDTO;
import com.becon.opencelium.backend.testutil.fixture.UserFixture;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link UserServiceImpl} methods that read from
 * {@link SecurityContextHolder}: {@code getCurrentUser} and
 * {@code changePassword}.
 *
 * Split out from {@link UserServiceImplTest} so the thread-local
 * {@code SecurityContext} setup/teardown does not leak into unrelated tests.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceImplSecurityContextTest {

    @Mock
    BCryptPasswordEncoder bCryptPasswordEncoder;

    @Mock
    UserRepository userRepository;

    @Mock
    UserRoleRepository userRoleRepository;

    @Mock
    UserDetailServiceImpl detailService;

    @Mock
    SessionServiceImpl sessionService;

    @Mock
    WidgetSettingServiceImp widgetSettingServiceImp;

    @InjectMocks
    UserServiceImpl userService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // ── getCurrentUser ────────────────────────────────────────────────────────

    @Test
    void getCurrentUserReturnsUserWhenPrincipalIsUserDetails() {
        User stored = UserFixture.anEmptyUser();
        stored.setEmail("alice@example.com");
        UserDetails principal = new org.springframework.security.core.userdetails.User(
                "alice@example.com", "irrelevant", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "irrelevant", principal.getAuthorities()));
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(stored));

        User result = userService.getCurrentUser();

        assertThat(result).isSameAs(stored);
        verify(userRepository).findByEmail("alice@example.com");
    }

    @Test
    void getCurrentUserReturnsNullWhenAuthenticationIsAbsent() {
        SecurityContextHolder.clearContext();

        User result = userService.getCurrentUser();

        assertThat(result).isNull();
        verifyNoInteractions(userRepository);
    }

    @Test
    void getCurrentUserReturnsNullWhenPrincipalIsNotUserDetails() {
        SecurityContextHolder.getContext().setAuthentication(
                new AnonymousAuthenticationToken(
                        "key", "anonymousUser", List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))));

        User result = userService.getCurrentUser();

        assertThat(result).isNull();
        verifyNoInteractions(userRepository);
    }

    // ── changePassword ────────────────────────────────────────────────────────

    @Test
    void changePasswordThrowsServiceUnavailableExceptionWhenAuthMethodIsLdap() {
        User current = UserFixture.anEmptyUser();
        current.setEmail("ldap-user@example.com");
        current.setAuthMethod(AuthMethod.LDAP);
        authenticateAs(current);
        when(userRepository.findByEmail("ldap-user@example.com")).thenReturn(Optional.of(current));

        ChangePasswordDTO dto = new ChangePasswordDTO("oldPw", "newPw", "newPw");

        assertThatThrownBy(() -> userService.changePassword(dto))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessage("Password is managed externally.")
                .extracting("error").isEqualTo(ExceptionConstant.PASSWORD_MANAGED_EXTERNALLY);

        verifyNoInteractions(bCryptPasswordEncoder);
        assertThat(current.getPassword()).isNull();
    }

    @Test
    void changePasswordThrowsGeneralServiceExceptionWhenCurrentPasswordDoesNotMatch() {
        User current = UserFixture.anEmptyUser();
        current.setEmail("alice@example.com");
        current.setAuthMethod(AuthMethod.BASIC);
        current.setPassword("$2a$old");
        authenticateAs(current);
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(current));
        when(bCryptPasswordEncoder.matches("wrongPw", "$2a$old")).thenReturn(false);

        ChangePasswordDTO dto = new ChangePasswordDTO("wrongPw", "newPw", "newPw");

        assertThatThrownBy(() -> userService.changePassword(dto))
                .isInstanceOf(GeneralServiceException.class)
                .hasMessage("wrong password")
                .extracting("status", "error")
                .containsExactly(HttpStatus.BAD_REQUEST, ExceptionConstant.WRONG_PASSWORD);

        assertThat(current.getPassword()).isEqualTo("$2a$old");
        verify(bCryptPasswordEncoder).matches("wrongPw", "$2a$old");
    }

    @Test
    void changePasswordReEncodesPasswordOnCurrentUserWhenInputsAreValid() {
        User current = UserFixture.anEmptyUser();
        current.setEmail("alice@example.com");
        current.setAuthMethod(AuthMethod.BASIC);
        current.setPassword("$2a$old");
        authenticateAs(current);
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(current));
        when(bCryptPasswordEncoder.matches("oldPw", "$2a$old")).thenReturn(true);
        when(bCryptPasswordEncoder.encode("newPw")).thenReturn("$2a$new");

        ChangePasswordDTO dto = new ChangePasswordDTO("oldPw", "newPw", "newPw");

        userService.changePassword(dto);

        assertThat(current.getPassword()).isEqualTo("$2a$new");
        verify(bCryptPasswordEncoder).matches("oldPw", "$2a$old");
        verify(bCryptPasswordEncoder).encode("newPw");
        verify(userRepository).findByEmail("alice@example.com");
        verify(userRepository, org.mockito.Mockito.never()).save(org.mockito.ArgumentMatchers.any());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static void authenticateAs(User user) {
        UserDetails principal = new org.springframework.security.core.userdetails.User(
                user.getEmail(), "irrelevant", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "irrelevant", principal.getAuthorities()));
    }
}
