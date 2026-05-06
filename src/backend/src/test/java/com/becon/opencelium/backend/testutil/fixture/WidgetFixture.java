/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.entity.Widget;
import com.becon.opencelium.backend.database.mysql.entity.WidgetSetting;
import com.becon.opencelium.backend.resource.user.WidgetResource;
import com.becon.opencelium.backend.resource.user.WidgetSettingResource;

/**
 * Object mother for {@link Widget}, {@link WidgetSetting}, and their resource counterparts.
 *
 * Use the named factory methods in test classes — never construct these objects inline.
 * Add new named scenarios here rather than duplicating setup across test classes.
 */
public final class WidgetFixture {

    private WidgetFixture() {}

    // ── Widget entity factories ───────────────────────────────────────────────

    /**
     * Widget with id left at 0 — suitable for JPA slice tests where
     * {@code TestEntityManager.persist()} must let the database assign the id.
     */
    public static Widget aTransientWidget() {
        Widget widget = new Widget();
        widget.setName("system-metrics");
        widget.setIcon("metrics-icon.png");
        widget.setTooltipTranslationKey("widget.system_metrics");
        return widget;
    }

    /**
     * Widget with a pre-set id — suitable for unit tests where JPA is not involved.
     */
    public static Widget aWidget() {
        Widget widget = aTransientWidget();
        widget.setId(1);
        return widget;
    }

    /**
     * Widget with a pre-set id and a custom name — use when a test needs a widget
     * distinct from the default "system-metrics" scenario (e.g. testing a list
     * with two different widgets).
     */
    public static Widget aWidgetNamed(String name) {
        Widget widget = new Widget();
        widget.setId(1);
        widget.setName(name);
        widget.setIcon(name + "-icon.png");
        widget.setTooltipTranslationKey("widget." + name.replace("-", "_"));
        return widget;
    }

    // ── WidgetResource factories ──────────────────────────────────────────────

    public static WidgetResource aWidgetResource() {
        WidgetResource resource = new WidgetResource();
        resource.setWidgetId(1);
        resource.setI("system-metrics");
        resource.setIcon("metrics-icon.png");
        resource.setTooltipTranslationKey("widget.system_metrics");
        return resource;
    }

    // ── WidgetSetting entity factories ────────────────────────────────────────

    /**
     * WidgetSetting with a pre-set id — suitable for unit tests where JPA is not involved.
     */
    public static WidgetSetting aWidgetSetting(Widget widget) {
        return aWidgetSetting(widget, UserFixture.anEmptyUser());
    }

    /**
     * WidgetSetting with a pre-set id and an explicit user — use when the test needs to control
     * which user the setting belongs to.
     */
    public static WidgetSetting aWidgetSetting(Widget widget, User user) {
        WidgetSetting ws = aTransientWidgetSetting(widget, user);
        ws.setId(10);
        return ws;
    }

    /**
     * WidgetSetting with id left at 0 — suitable for JPA slice tests where
     * {@code TestEntityManager.persist()} must let the database assign the id.
     */
    public static WidgetSetting aTransientWidgetSetting(Widget widget, User user) {
        WidgetSetting ws = new WidgetSetting();
        ws.setAxisX(0);
        ws.setAxisY(0);
        ws.setWidth(4);
        ws.setHeight(3);
        ws.setMinWidth(2);
        ws.setMinHeight(2);
        ws.setWidget(widget);
        ws.setUser(user);
        return ws;
    }

    // ── WidgetSettingResource factories ───────────────────────────────────────

    public static WidgetSettingResource aWidgetSettingResource() {
        WidgetSettingResource resource = new WidgetSettingResource();
        resource.setWidgetSettingId(0);
        resource.setWidgetId(1);
        resource.setX(0);
        resource.setY(0);
        resource.setW(4);
        resource.setH(3);
        resource.setMinW(2);
        resource.setMinH(2);
        return resource;
    }
}
