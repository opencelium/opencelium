/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.UserDetail;
import com.becon.opencelium.backend.database.mysql.repository.UserDetailRepository;
import com.becon.opencelium.backend.database.mysql.service.UserDetailServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.resource.user.UserDetailResource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserDetailServiceImplTest {

    @Mock
    UserDetailRepository userDetailRepository;

    @Mock
    UserServiceImpl userService;

    @InjectMocks
    UserDetailServiceImpl userDetailService;

    @Test
    void saveDelegatesToRepository() {
        UserDetail detail = new UserDetail();

        userDetailService.save(detail);

        verify(userDetailRepository).save(detail);
        verifyNoMoreInteractions(userDetailRepository);
        verifyNoInteractions(userService);
    }

    @Test
    void existsByIdDelegatesToRepository() {
        when(userDetailRepository.existsById(42)).thenReturn(true);

        boolean result = userDetailService.existsById(42);

        assertThat(result).isTrue();
        verify(userDetailRepository).existsById(42);
        verifyNoMoreInteractions(userDetailRepository);
        verifyNoInteractions(userService);
    }

    @Test
    void toEntityEncodesBitbucketPasswordWhenProvided() {
        UserDetailResource resource = new UserDetailResource();
        resource.setBitbucketPassword("plain");
        when(userService.encodePassword("plain")).thenReturn("$2a$enc");

        UserDetail result = userDetailService.toEntity(resource);

        assertThat(result).isNotNull();
        assertThat(resource.getBitbucketPassword()).isEqualTo("$2a$enc");
        verify(userService).encodePassword("plain");
        verifyNoMoreInteractions(userService);
        verifyNoInteractions(userDetailRepository);
    }

    @Test
    void toEntitySkipsEncodingWhenBitbucketPasswordIsNull() {
        UserDetailResource resource = new UserDetailResource();
        resource.setBitbucketPassword(null);

        UserDetail result = userDetailService.toEntity(resource);

        assertThat(result).isNotNull();
        assertThat(resource.getBitbucketPassword()).isNull();
        verifyNoInteractions(userService);
        verifyNoInteractions(userDetailRepository);
    }

    @Test
    void toEntitySkipsEncodingWhenBitbucketPasswordIsEmpty() {
        UserDetailResource resource = new UserDetailResource();
        resource.setBitbucketPassword("");

        UserDetail result = userDetailService.toEntity(resource);

        assertThat(result).isNotNull();
        assertThat(resource.getBitbucketPassword()).isEmpty();
        verifyNoInteractions(userService);
        verifyNoInteractions(userDetailRepository);
    }

    @Test
    void toEntityThrowsNullPointerExceptionWhenResourceIsNull() {
        assertThatThrownBy(() -> userDetailService.toEntity(null))
                .isInstanceOf(NullPointerException.class);

        verifyNoInteractions(userService);
        verifyNoInteractions(userDetailRepository);
    }
}
