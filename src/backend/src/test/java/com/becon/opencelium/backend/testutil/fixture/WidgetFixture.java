/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mysql.entity.Widget;
import com.becon.opencelium.backend.database.mysql.entity.WidgetSetting;
import com.becon.opencelium.backend.resource.user.WidgetResource;

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
}
