/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.slice.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.service.SessionServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserDetailServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.WidgetSettingServiceImp;
import com.becon.opencelium.backend.enums.AuthMethod;
import com.becon.opencelium.backend.resource.ChangePasswordDTO;
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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Slice test for {@link UserServiceImpl#changePassword}.
 *
 * The production method updates {@code user.password} but never calls
 * {@code userRepository.save(...)} — it relies on JPA dirty checking inside
 * the surrounding {@code @Transactional} boundary. A unit test can only assert
 * that {@code save} was not invoked; it cannot verify the change actually
 * reaches the database. This slice does, by flushing and re-reading.
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

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void changePasswordPersistsNewPasswordViaDirtyCheckingWithoutExplicitSave() {
        User persisted = UserFixture.anEmptyUser();
        persisted.setEmail("alice@example.com");
        persisted.setAuthMethod(AuthMethod.BASIC);
        persisted.setPassword(encoder.encode("oldPass"));
        em.persistAndFlush(persisted);
        int userId = persisted.getId();

        UserDetails principal = new org.springframework.security.core.userdetails.User(
                "alice@example.com", "irrelevant", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "irrelevant", principal.getAuthorities()));

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

    @TestConfiguration
    static class EncoderConfig {
        @Bean
        BCryptPasswordEncoder bCryptPasswordEncoder() {
            return new BCryptPasswordEncoder();
        }
    }
}
