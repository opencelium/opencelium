/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil.assertion;

import com.becon.opencelium.backend.database.mysql.entity.Widget;
import org.assertj.core.api.AbstractAssert;

/**
 * Custom AssertJ assertions for {@link Widget}.
 *
 * Wraps repeated field-level checks into readable, chainable one-liners so
 * test classes express intent rather than field comparisons.
 *
 * Usage:
 *   WidgetAssertions.assertThat(widget)
 *                   .isSystemMetricsWidget()
 *                   .hasId(1);
 *
 * Add a new method here when the same field check appears in two or more
 * test classes. Do not add methods speculatively — let duplication drive it.
 */
public class WidgetAssertions extends AbstractAssert<WidgetAssertions, Widget> {

    private WidgetAssertions(Widget actual) {
        super(actual, WidgetAssertions.class);
    }

    /**
     * Entry point — mirrors AssertJ's assertThat() style.
     *
     * WidgetAssertions.assertThat(widget).isSystemMetricsWidget().hasId(1);
     */
    public static WidgetAssertions assertThat(Widget actual) {
        return new WidgetAssertions(actual);
    }

    // ── Named-scenario checks ─────────────────────────────────────────────────

    /**
     * Verifies the widget matches the "system-metrics" fixture scenario
     * produced by {@link com.becon.opencelium.backend.testutil.fixture.WidgetFixture#aWidget()}.
     */
    public WidgetAssertions isSystemMetricsWidget() {
        hasName("system-metrics");
        hasIcon("metrics-icon.png");
        hasTooltipKey("widget.system_metrics");
        return this;
    }

    // ── Field checks ──────────────────────────────────────────────────────────

    public WidgetAssertions hasId(int expected) {
        isNotNull();
        if (actual.getId() != expected) {
            failWithMessage("Expected widget id to be <%d> but was <%d>", expected, actual.getId());
        }
        return this;
    }

    public WidgetAssertions hasName(String expected) {
        isNotNull();
        if (!expected.equals(actual.getName())) {
            failWithMessage("Expected widget name to be <%s> but was <%s>", expected, actual.getName());
        }
        return this;
    }

    public WidgetAssertions hasIcon(String expected) {
        isNotNull();
        if (!expected.equals(actual.getIcon())) {
            failWithMessage("Expected widget icon to be <%s> but was <%s>", expected, actual.getIcon());
        }
        return this;
    }

    public WidgetAssertions hasTooltipKey(String expected) {
        isNotNull();
        if (!expected.equals(actual.getTooltipTranslationKey())) {
            failWithMessage(
                "Expected widget tooltip key to be <%s> but was <%s>",
                expected, actual.getTooltipTranslationKey()
            );
        }
        return this;
    }
}
