/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.slice.database.mysql.service;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.service.SessionServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserDetailServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.WidgetSettingServiceImp;
import com.becon.opencelium.backend.enums.AuthMethod;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.resource.ChangePasswordDTO;
import com.becon.opencelium.backend.security.UserPrincipals;
import com.becon.opencelium.backend.storage.StorageService;
import com.becon.opencelium.backend.testutil.annotation.SliceTest;
import com.becon.opencelium.backend.testutil.fixture.UserFixture;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Slice test for {@link UserServiceImpl#changePassword} and {@link UserServiceImpl#save}.
 *
 * The production method updates {@code user.password} but never calls
 * {@code userRepository.save(...)} — it relies on JPA dirty checking inside
 * the surrounding {@code @Transactional} boundary. A unit test can only assert
 * that {@code save} was not invoked; it cannot verify the change actually
 * reaches the database. This slice does, by flushing and re-reading.
 *
 * The {@code save} cases run the email uniqueness check against real rows, which
 * the unit test only mocks: a user without an email, and a user re-saving its own.
 *
 * Run with: ./gradlew test --tests "*.UserServiceImplSliceTest"
 */
@SliceTest
@Import({UserServiceImpl.class, UserServiceImplSliceTest.EncoderConfig.class})
@DisplayName("UserServiceImpl — JPA slice")
class UserServiceImplSliceTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private UserServiceImpl userService;

    @Autowired
    private BCryptPasswordEncoder encoder;

    // ── Services not invoked by changePassword — required to satisfy DI ───────

    @MockBean
    private UserDetailServiceImpl userDetailService;

    @MockBean
    private SessionServiceImpl sessionService;

    @MockBean
    private WidgetSettingServiceImp widgetSettingService;

    @MockBean
    private StorageService storageService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void changePasswordPersistsNewPasswordWhenSessionFlushes() {
        User persisted = UserFixture.anEmptyUser();
        persisted.setEmail("alice@example.com");
        persisted.setAuthMethod(AuthMethod.BASIC);
        persisted.setPassword(encoder.encode("oldPass"));
        em.persistAndFlush(persisted);
        int userId = persisted.getId();

        // The filter hands the service a user loaded outside its transaction; only the id must match,
        // getCurrentUser re-reads the row so that dirty checking applies to a managed entity.
        User detached = UserFixture.anEmptyUser();
        detached.setId(userId);
        UserPrincipals principal = new UserPrincipals(detached);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        principal, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));

        userService.changePassword(new ChangePasswordDTO("oldPass", "newPass", "newPass"));

        em.flush();
        em.clear();

        User refetched = em.find(User.class, userId);
        assertThat(refetched).isNotNull();
        assertThat(encoder.matches("newPass", refetched.getPassword()))
                .as("changePassword must persist the new password via dirty checking — no explicit save() is performed in production")
                .isTrue();
        assertThat(encoder.matches("oldPass", refetched.getPassword())).isFalse();
    }

    @Test
    void saveStoresBasicUserWithoutEmailWhenAnotherUserHasNoEmailEither() {
        User alice = UserFixture.anEmptyUser();
        alice.setAuthMethod(AuthMethod.BASIC);
        alice.setUsername("alice");
        em.persistAndFlush(alice);

        User bob = UserFixture.anEmptyUser();
        bob.setAuthMethod(AuthMethod.BASIC);
        bob.setUsername("bob");
        bob.setEmail("");

        int bobId = userService.save(bob).getId();
        em.flush();
        em.clear();

        User refetched = em.find(User.class, bobId);
        assertThat(refetched.getEmail()).isNull();
        assertThat(refetched.getUsername()).isEqualTo("bob");
    }

    @Test
    void saveThrowsWhenEmailBelongsToAnotherUser() {
        User alice = UserFixture.anEmptyUser();
        alice.setAuthMethod(AuthMethod.BASIC);
        alice.setEmail("alice@example.com");
        em.persistAndFlush(alice);

        User bob = UserFixture.anEmptyUser();
        bob.setAuthMethod(AuthMethod.BASIC);
        bob.setEmail("alice@example.com");

        assertThatThrownBy(() -> userService.save(bob))
                .isInstanceOf(GeneralServiceException.class)
                .hasFieldOrPropertyWithValue("error", ExceptionConstant.EMAIL_ALREADY_EXIST);
    }

    @Test
    void saveKeepsOwnEmailWhenUserIsUpdated() {
        User alice = UserFixture.anEmptyUser();
        alice.setAuthMethod(AuthMethod.BASIC);
        alice.setEmail("alice@example.com");
        em.persistAndFlush(alice);
        int aliceId = alice.getId();
        em.clear();

        // The user form sends the whole record again, unchanged email included.
        User update = UserFixture.anEmptyUser();
        update.setId(aliceId);
        update.setAuthMethod(AuthMethod.BASIC);
        update.setEmail("alice@example.com");
        update.setUsername("alice");

        userService.save(update);
        em.flush();
        em.clear();

        User refetched = em.find(User.class, aliceId);
        assertThat(refetched.getEmail()).isEqualTo("alice@example.com");
        assertThat(refetched.getUsername()).isEqualTo("alice");
    }

    @TestConfiguration
    static class EncoderConfig {
        @Bean
        BCryptPasswordEncoder bCryptPasswordEncoder() {
            return new BCryptPasswordEncoder();
        }
    }
}
