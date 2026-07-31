/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.slice.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.entity.Widget;
import com.becon.opencelium.backend.database.mysql.entity.WidgetSetting;
import com.becon.opencelium.backend.database.mysql.repository.WidgetSettingRepository;
import com.becon.opencelium.backend.testutil.annotation.SliceTest;
import com.becon.opencelium.backend.testutil.fixture.UserFixture;
import com.becon.opencelium.backend.testutil.fixture.WidgetFixture;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * JPA slice test for {@link WidgetSettingRepository#findByUserId(int)}.
 *
 * Validates that Spring Data correctly resolves the derived query against
 * the H2 schema. A unit test cannot catch a typo or schema drift here
 * because Spring Data only validates derived-query method names at runtime.
 *
 * Run with: ./gradlew test --tests "*.WidgetSettingRepositoryTest"
 */
@SliceTest
@DisplayName("WidgetSettingRepository — JPA slice")
class WidgetSettingRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private WidgetSettingRepository widgetSettingRepository;

    // ── findByUserId ──────────────────────────────────────────────────────────

    @Test
    void findByUserIdReturnsSettingsWhenUserHasSavedSettings() {
        Widget widget = WidgetFixture.aTransientWidget();
        em.persist(widget);

        User user = UserFixture.anEmptyUser();
        em.persist(user);

        em.persist(WidgetFixture.aTransientWidgetSetting(widget, user));
        em.flush();

        List<WidgetSetting> result = widgetSettingRepository.findByUserId(user.getId());

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getWidget().getName()).isEqualTo("system-metrics");
    }

    @Test
    void findByUserIdReturnsEmptyListWhenUserHasNoSettings() {
        User user = UserFixture.anEmptyUser();
        em.persist(user);
        em.flush();

        List<WidgetSetting> result = widgetSettingRepository.findByUserId(user.getId());

        assertThat(result).isEmpty();
    }

    @Test
    void findByUserIdExcludesSettingsOwnedByOtherUsersWhenQueried() {
        Widget widget = WidgetFixture.aTransientWidget();
        em.persist(widget);

        User user1 = UserFixture.anEmptyUser();
        em.persist(user1);

        User user2 = UserFixture.anEmptyUser();
        em.persist(user2);

        em.persist(WidgetFixture.aTransientWidgetSetting(widget, user1));
        em.flush();

        List<WidgetSetting> result = widgetSettingRepository.findByUserId(user2.getId());

        assertThat(result).isEmpty();
    }
}
