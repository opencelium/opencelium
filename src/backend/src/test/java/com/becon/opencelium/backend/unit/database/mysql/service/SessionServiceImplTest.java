/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Session;
import com.becon.opencelium.backend.database.mysql.repository.SessionRepository;
import com.becon.opencelium.backend.database.mysql.service.SessionServiceImpl;
import com.becon.opencelium.backend.testutil.fixture.SessionFixture;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link SessionServiceImpl}.
 *
 * Read paths and {@code save} are thin delegates verified by mock interaction.
 * {@code replace} is the load-bearing method: its delete-then-insert order and
 * the new-session field values (active=true, attempts=0, fresh UUID id) are
 * pinned via captors. The {@code attempts=0} assertion deliberately documents
 * the current behaviour that resets TOTP failure counts on every
 * password-stage re-authentication.
 */
@ExtendWith(MockitoExtension.class)
class SessionServiceImplTest {

    @Mock
    private SessionRepository sessionRepository;

    @InjectMocks
    private SessionServiceImpl service;

    // ── findById ──────────────────────────────────────────────────────────────

    @Test
    void findByIdReturnsRepositoryResultWhenSessionExists() {
        Session session = SessionFixture.aSessionWithId("abc", 1);
        when(sessionRepository.findById("abc")).thenReturn(Optional.of(session));

        Optional<Session> result = service.findById("abc");

        assertThat(result).containsSame(session);
    }

    @Test
    void findByIdReturnsEmptyWhenSessionMissing() {
        when(sessionRepository.findById("missing")).thenReturn(Optional.empty());

        assertThat(service.findById("missing")).isEmpty();
    }

    // ── save ──────────────────────────────────────────────────────────────────

    @Test
    void savePersistsEntityWhenCalled() {
        Session session = SessionFixture.anActiveSession(1);

        service.save(session);

        verify(sessionRepository).save(session);
    }

    // ── findByUserId ──────────────────────────────────────────────────────────

    @Test
    void findByUserIdReturnsRepositoryResultWhenSessionExists() {
        Session session = SessionFixture.anActiveSession(42);
        when(sessionRepository.findByUserId(42)).thenReturn(Optional.of(session));

        Optional<Session> result = service.findByUserId(42);

        assertThat(result).containsSame(session);
    }

    @Test
    void findByUserIdReturnsEmptyWhenNoSessionForUser() {
        when(sessionRepository.findByUserId(99)).thenReturn(Optional.empty());

        assertThat(service.findByUserId(99)).isEmpty();
    }

    // ── deleteByUserId ────────────────────────────────────────────────────────

    @Test
    void deleteByUserIdInvokesRepositoryWhenCalled() {
        service.deleteByUserId(42);

        verify(sessionRepository).deleteByUserId(42);
    }

    // ── replace ───────────────────────────────────────────────────────────────

    @Test
    void replaceDeletesOldSessionWhenReplacing() {
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));

        service.replace(42);

        InOrder order = inOrder(sessionRepository);
        order.verify(sessionRepository).deleteByUserId(42);
        order.verify(sessionRepository).save(any(Session.class));
    }

    @Test
    void replaceCreatesActiveSessionWithFreshUuidWhenInvoked() {
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));

        service.replace(42);

        ArgumentCaptor<Session> captor = ArgumentCaptor.forClass(Session.class);
        verify(sessionRepository).save(captor.capture());
        Session persisted = captor.getValue();

        assertThat(persisted.getUserId()).isEqualTo(42);
        assertThat(persisted.isActive()).isTrue();
        assertThat(persisted.getAttempts()).isZero();
        // The id must be a parsable UUID — not null, not deterministic, not a sentinel.
        assertThat(persisted.getId()).isNotBlank();
        assertThat(UUID.fromString(persisted.getId())).isNotNull();
    }

    @Test
    void replaceReturnsSavedSessionWhenInvoked() {
        Session saved = SessionFixture.anActiveSession(42);
        when(sessionRepository.save(any(Session.class))).thenReturn(saved);

        Session result = service.replace(42);

        // Contract: replace returns whatever the repository returns from save,
        // not the locally-constructed Session.
        assertThat(result).isSameAs(saved);
    }

    @Test
    void replaceGeneratesDistinctIdsWhenCalledRepeatedly() {
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));

        service.replace(1);
        service.replace(2);

        ArgumentCaptor<Session> captor = ArgumentCaptor.forClass(Session.class);
        verify(sessionRepository, org.mockito.Mockito.times(2)).save(captor.capture());

        assertThat(captor.getAllValues())
                .extracting(Session::getId)
                .doesNotHaveDuplicates();
    }

    // ── updateLastAccessedTime ────────────────────────────────────────────────

    @Test
    void updateLastAccessedTimeWritesCurrentTimeWhenCalled() {
        long before = System.currentTimeMillis();

        service.updateLastAccessedTime("abc");

        long after = System.currentTimeMillis();
        ArgumentCaptor<Date> captor = ArgumentCaptor.forClass(Date.class);
        verify(sessionRepository).updateLastAccessed(org.mockito.ArgumentMatchers.eq("abc"), captor.capture());

        // The Date must come from the call site (≈ now), not from a stale field.
        // Inclusive bounds because clock resolution can put before/after/captured
        // all on the same millisecond on fast machines.
        long captured = captor.getValue().getTime();
        assertThat(captured).isBetween(before, after);
    }
}
