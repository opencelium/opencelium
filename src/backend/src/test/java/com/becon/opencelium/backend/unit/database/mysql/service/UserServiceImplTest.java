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
import com.becon.opencelium.backend.database.mysql.entity.UserDetail;
import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import com.becon.opencelium.backend.database.mysql.entity.WidgetSetting;
import com.becon.opencelium.backend.database.mysql.repository.UserRepository;
import com.becon.opencelium.backend.database.mysql.repository.UserRoleRepository;
import com.becon.opencelium.backend.database.mysql.service.SessionServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserDetailServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.WidgetSettingServiceImp;
import com.becon.opencelium.backend.enums.AuthMethod;
import com.becon.opencelium.backend.resource.request.UserRequestResource;
import com.becon.opencelium.backend.resource.user.UserDetailResource;
import com.becon.opencelium.backend.resource.user.UserResource;
import com.becon.opencelium.backend.resource.user.UserRoleResource;
import com.becon.opencelium.backend.resource.user.WidgetSettingResource;
import com.becon.opencelium.backend.testutil.fixture.UserFixture;
import com.becon.opencelium.backend.testutil.fixture.UserRoleFixture;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link UserServiceImpl} — pure logic, repository passthroughs,
 * request/resource mapping, and the heavy {@code requestToEntity} branching.
 *
 * Security-context-dependent behaviour ({@code getCurrentUser},
 * {@code changePassword}) lives in {@code UserServiceImplSecurityContextTest}
 * so the {@code SecurityContextHolder} lifecycle is isolated from the rest of
 * the suite.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

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

    // ── findByEmail / findByUsername / findById / getById ─────────────────────

    @Test
    void findByEmailReturnsUserWhenExists() {
        User user = UserFixture.anEmptyUser();
        user.setEmail("a@b.com");
        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));

        Optional<User> result = userService.findByEmail("a@b.com");

        assertThat(result).contains(user);
        verify(userRepository).findByEmail("a@b.com");
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void findByUsernameReturnsUserWhenExists() {
        User user = UserFixture.anEmptyUser();
        user.setUsername("bob");
        when(userRepository.findByUsernameAndAuthMethod("bob", AuthMethod.LDAP))
                .thenReturn(Optional.of(user));

        Optional<User> result = userService.findByUsername("bob");

        assertThat(result).isPresent();
        assertThat(result.get().getUsername()).isEqualTo("bob");
        verify(userRepository).findByUsernameAndAuthMethod("bob", AuthMethod.LDAP);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void findByUsernameReturnsEmptyWhenNotExists() {
        when(userRepository.findByUsernameAndAuthMethod("missing", AuthMethod.LDAP))
                .thenReturn(Optional.empty());

        Optional<User> result = userService.findByUsername("missing");

        assertThat(result).isEmpty();
        verify(userRepository).findByUsernameAndAuthMethod("missing", AuthMethod.LDAP);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void findByIdReturnsUserWhenExists() {
        User user = UserFixture.anEmptyUser();
        user.setId(7);
        when(userRepository.findOneById(7)).thenReturn(Optional.of(user));

        Optional<User> result = userService.findById(7);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(7);
        verify(userRepository).findOneById(7);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void findByIdReturnsEmptyWhenNotExists() {
        when(userRepository.findOneById(999)).thenReturn(Optional.empty());

        Optional<User> result = userService.findById(999);

        assertThat(result).isEmpty();
        verify(userRepository).findOneById(999);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void getByIdReturnsUserWhenFound() {
        User user = UserFixture.anEmptyUser();
        user.setId(5);
        when(userRepository.findOneById(5)).thenReturn(Optional.of(user));

        User result = userService.getById(5);

        assertThat(result.getId()).isEqualTo(5);
        verify(userRepository).findOneById(5);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void getByIdThrowsRuntimeExceptionWhenUserNotFound() {
        when(userRepository.findOneById(123)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getById(123))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("USER_NOT_FOUND");
    }

    // ── save ──────────────────────────────────────────────────────────────────

    @Test
    void saveReturnsSavedUserWhenEmailIsValid() {
        User input = UserFixture.anEmptyUser();
        input.setEmail("bob@example.com");

        User saved = UserFixture.anEmptyUser();
        saved.setId(10);
        saved.setEmail("bob@example.com");

        when(userRepository.save(input)).thenReturn(saved);

        User result = userService.save(input);

        assertThat(result.getId()).isEqualTo(10);
        assertThat(result.getEmail()).isEqualTo("bob@example.com");
        verify(userRepository).save(input);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void saveThrowsIllegalArgumentExceptionWhenEmailIsInvalid() {
        User input = UserFixture.anEmptyUser();
        input.setEmail("not-an-email");

        assertThatThrownBy(() -> userService.save(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid email is supplied to User dto");

        verifyNoInteractions(userRepository);
    }

    // ── existsByEmail / existsById / deleteById / findAll ─────────────────────

    @Test
    void existsByEmailReturnsTrueWhenRepositoryReportsExists() {
        when(userRepository.existsByEmail("a@b.com")).thenReturn(true);

        boolean result = userService.existsByEmail("a@b.com");

        assertThat(result).isTrue();
        verify(userRepository).existsByEmail("a@b.com");
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void existsByIdReturnsTrueWhenRepositoryReportsExists() {
        when(userRepository.existsById(42)).thenReturn(true);

        boolean result = userService.existsById(42);

        assertThat(result).isTrue();
        verify(userRepository).existsById(42);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void deleteByIdInvokesRepositoryWhenCalled() {
        userService.deleteById(13);

        verify(userRepository).deleteOneById(13);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void findAllReturnsAllUsersWhenRepositoryHasEntries() {
        User one = UserFixture.anEmptyUser();
        one.setId(1);
        User two = UserFixture.anEmptyUser();
        two.setId(2);
        when(userRepository.findAll()).thenReturn(List.of(one, two));

        List<User> result = userService.findAll();

        assertThat(result).containsExactly(one, two);
        verify(userRepository).findAll();
        verifyNoMoreInteractions(userRepository);
    }

    // ── encodePassword / toResource / toEntity ────────────────────────────────

    @Test
    void encodePasswordReturnsEncoderOutputWhenCalled() {
        when(bCryptPasswordEncoder.encode("rawPw")).thenReturn("$2a$encoded");

        String result = userService.encodePassword("rawPw");

        assertThat(result).isEqualTo("$2a$encoded");
        verify(bCryptPasswordEncoder).encode("rawPw");
        verifyNoMoreInteractions(bCryptPasswordEncoder);
    }

    @Test
    void toResourceReturnsResourceWhenEntityProvided() {
        UserDetail detail = new UserDetail();
        detail.setTutorial(false);

        User user = UserFixture.anEmptyUser();
        user.setId(11);
        user.setEmail("c@d.com");
        user.setUsername("carla");
        user.setUserRole(UserRoleFixture.aStandardUserRole());
        user.setUserDetail(detail);

        UserResource result = userService.toResource(user);

        assertThat(result.getUserId()).isEqualTo(11);
        assertThat(result.getEmail()).isEqualTo("c@d.com");
        assertThat(result.getUsername()).isEqualTo("carla");
    }

    @Test
    void toEntityMapsWidgetSettingsWhenResourceHasSettings() {
        WidgetSettingResource wsr1 = new WidgetSettingResource();
        wsr1.setWidgetId(101);
        WidgetSettingResource wsr2 = new WidgetSettingResource();
        wsr2.setWidgetId(102);

        WidgetSetting ws1 = new WidgetSetting();
        WidgetSetting ws2 = new WidgetSetting();

        UserResource resource = new UserResource();
        resource.setUserId(5);
        resource.setEmail("c@d.com");
        resource.setUsername("carla");
        resource.setUserDetail(new UserDetailResource());
        resource.setUserGroup(new UserRoleResource(7));
        resource.setWidgetSettings(List.of(wsr1, wsr2));

        when(widgetSettingServiceImp.toEntity(wsr1, 5)).thenReturn(ws1);
        when(widgetSettingServiceImp.toEntity(wsr2, 5)).thenReturn(ws2);

        User result = userService.toEntity(resource);

        assertThat(result.getId()).isEqualTo(5);
        assertThat(result.getEmail()).isEqualTo("c@d.com");
        assertThat(result.getUsername()).isEqualTo("carla");
        assertThat(result.getWidgetSettings()).containsExactly(ws1, ws2);
        verify(widgetSettingServiceImp).toEntity(wsr1, 5);
        verify(widgetSettingServiceImp).toEntity(wsr2, 5);
        verifyNoMoreInteractions(widgetSettingServiceImp);
    }

    // ── requestToEntity ───────────────────────────────────────────────────────

    @Test
    void requestToEntityCreatesNewUserWhenUserDoesNotExist() {
        UserRequestResource request = aRequestResource(0, "alice@example.com", "rawPw", 7);
        UserDetail mappedDetail = new UserDetail();
        UserRole role = UserRoleFixture.aStandardUserRole();

        when(userRepository.findById(0)).thenReturn(Optional.empty());
        when(userRoleRepository.findById(7)).thenReturn(Optional.of(role));
        when(bCryptPasswordEncoder.encode("rawPw")).thenReturn("$2a$enc");
        when(detailService.toEntity(any(UserDetailResource.class))).thenReturn(mappedDetail);
        when(sessionService.findByUserId(0)).thenReturn(Optional.empty());

        User result = userService.requestToEntity(request);

        assertThat(result.getId()).isEqualTo(0);
        assertThat(result.getEmail()).isEqualTo("alice@example.com");
        assertThat(result.getPassword()).isEqualTo("$2a$enc");
        assertThat(result.getUserRole()).isSameAs(role);
        assertThat(result.getSession()).isNull();
        assertThat(result.getUserDetail()).isSameAs(mappedDetail);
        assertThat(mappedDetail.getUser()).isSameAs(result);
        assertThat(mappedDetail.getId()).isEqualTo(0);
        verify(bCryptPasswordEncoder).encode("rawPw");
    }

    @Test
    void requestToEntityReEncodesPasswordWhenUserExistsAndPasswordProvided() {
        UserRequestResource request = aRequestResource(5, "alice@example.com", "newPw", 7);

        User userDb = UserFixture.anEmptyUser();
        userDb.setId(5);
        userDb.setPassword("$2a$old");
        userDb.setAuthMethod(AuthMethod.LDAP);
        userDb.setUsername("alice");
        userDb.setTotpProcessCompleted(true);
        userDb.setTotpSecretKey("secret-key");
        UserDetail dbDetail = new UserDetail();
        dbDetail.setProfilePicture("pic.png");
        userDb.setUserDetail(dbDetail);

        UserDetail mappedDetail = new UserDetail();
        UserRole role = UserRoleFixture.aStandardUserRole();

        when(userRepository.findById(5)).thenReturn(Optional.of(userDb));
        when(userRoleRepository.findById(7)).thenReturn(Optional.of(role));
        when(bCryptPasswordEncoder.encode("newPw")).thenReturn("$2a$new");
        when(detailService.toEntity(any(UserDetailResource.class))).thenReturn(mappedDetail);
        when(sessionService.findByUserId(5)).thenReturn(Optional.empty());

        User result = userService.requestToEntity(request);

        assertThat(result.getPassword()).isEqualTo("$2a$new");
        assertThat(result.getAuthMethod()).isEqualTo(AuthMethod.LDAP);
        assertThat(result.isTotpProcessCompleted()).isTrue();
        assertThat(result.getTotpSecretKey()).isEqualTo("secret-key");
        assertThat(result.getUsername()).isEqualTo("alice");
        assertThat(request.getUserDetail().getProfilePicture()).isEqualTo("pic.png");
        verify(bCryptPasswordEncoder).encode("newPw");
    }

    @Test
    void requestToEntityKeepsExistingPasswordWhenUserExistsAndPasswordOmitted() {
        UserRequestResource request = aRequestResource(5, "alice@example.com", "", 7);

        User userDb = UserFixture.anEmptyUser();
        userDb.setId(5);
        userDb.setPassword("$2a$old");
        userDb.setAuthMethod(AuthMethod.BASIC);
        userDb.setUsername("alice");
        UserDetail dbDetail = new UserDetail();
        dbDetail.setProfilePicture("pic.png");
        userDb.setUserDetail(dbDetail);

        UserRole role = UserRoleFixture.aStandardUserRole();
        UserDetail mappedDetail = new UserDetail();

        when(userRepository.findById(5)).thenReturn(Optional.of(userDb));
        when(userRoleRepository.findById(7)).thenReturn(Optional.of(role));
        when(detailService.toEntity(any(UserDetailResource.class))).thenReturn(mappedDetail);
        when(sessionService.findByUserId(5)).thenReturn(Optional.empty());

        User result = userService.requestToEntity(request);

        assertThat(result.getPassword()).isEqualTo("$2a$old");
        assertThat(request.getUserDetail().getProfilePicture()).isEqualTo("pic.png");
        verifyNoInteractions(bCryptPasswordEncoder);
    }

    @Test
    void requestToEntityThrowsWhenNewUserAndPasswordIsNull() {
        UserRequestResource request = aRequestResource(0, "alice@example.com", null, 7);

        assertThatThrownBy(() -> userService.requestToEntity(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage(ExceptionConstant.PASSWORD_IS_NULL);

        verifyNoInteractions(bCryptPasswordEncoder);
        verify(detailService, never()).toEntity(any());
        verify(sessionService, never()).findByUserId(anyInt());
    }

    @Test
    void requestToEntityThrowsWhenNewUserAndPasswordIsEmpty() {
        UserRequestResource request = aRequestResource(0, "alice@example.com", "", 7);

        assertThatThrownBy(() -> userService.requestToEntity(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage(ExceptionConstant.PASSWORD_IS_NULL);

        verifyNoInteractions(bCryptPasswordEncoder);
        verify(detailService, never()).toEntity(any());
        verify(sessionService, never()).findByUserId(anyInt());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static UserRequestResource aRequestResource(int userId, String email, String password, int userGroup) {
        UserRequestResource r = new UserRequestResource();
        r.setUserId(userId);
        r.setEmail(email);
        r.setPassword(password);
        r.setUserGroup(userGroup);
        r.setUserDetail(new UserDetailResource());
        return r;
    }
}
