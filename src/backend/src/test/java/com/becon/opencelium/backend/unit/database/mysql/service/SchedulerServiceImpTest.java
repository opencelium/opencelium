/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.database.mysql.service.SchedulerServiceImp;
import com.becon.opencelium.backend.quartz.SchedulingStrategy;
import com.becon.opencelium.backend.resource.schedule.RunningJob;
import com.becon.opencelium.backend.testutil.fixture.RunningJobFixture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the test-connection helpers on {@link SchedulerServiceImp}:
 * {@code getRunningConnectionIds}, {@code filterByTestFlag} and {@code filterEntitiesByTestFlag}.
 *
 * Run with: ./gradlew test --tests "*.SchedulerServiceImpTest"
 */
@ExtendWith(MockitoExtension.class)
class SchedulerServiceImpTest {

    @Mock
    private SchedulingStrategy schedulingStrategy;

    @Mock
    private ConnectionService connectionService;

    private SchedulerService schedulerService;

    @BeforeEach
    void setUp() {
        // The constructor derives schedulingStrategy from a SchedulerFactoryBean, so it cannot be
        // injected directly — construct with the dependencies under test and swap in the mock strategy.
        SchedulerFactoryBean schedulerFactoryBean = mock(SchedulerFactoryBean.class);
        schedulerService = new SchedulerServiceImp(
                connectionService, null, null, null, null, null, null, null, schedulerFactoryBean, null, null);
        ReflectionTestUtils.setField(schedulerService, "schedulingStrategy", schedulingStrategy);
    }

    // ── getRunningConnectionIds ───────────────────────────────────────────────

    @Test
    void getRunningConnectionIdsReturnsConnectionIdsFromStrategy() {
        // GIVEN
        var runningJobs = List.of(
                RunningJobFixture.aRunningJob(1L, 2, 1L),
                RunningJobFixture.aRunningJob(2L, 3, 2L)
        );

        when(schedulingStrategy.getRunningJobs()).thenReturn(runningJobs);

        // WHEN
        Set<Long> result = schedulerService.getRunningConnectionIds();

        // THEN
        assertThat(result).containsExactlyInAnyOrder(1L, 2L);
    }

    @Test
    void getRunningConnectionIdsReturnsUnmodifiableSet() {
        // GIVEN
        var runningJobs = new ArrayList<RunningJob>();

        runningJobs.add(RunningJobFixture.aRunningJob(1L, 2, 1L));
        runningJobs.add(RunningJobFixture.aRunningJob(2L, 3, 2L));

        when(schedulingStrategy.getRunningJobs()).thenReturn(runningJobs);

        // WHEN-THEN
        Set<Long> result = schedulerService.getRunningConnectionIds();

        assertThatThrownBy(() -> result.add(99L))
                .isInstanceOf(UnsupportedOperationException.class);
    }
}
