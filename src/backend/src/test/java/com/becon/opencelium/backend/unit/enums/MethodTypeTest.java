/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.enums;

import com.becon.opencelium.backend.enums.MethodType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.ValueInstantiationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link MethodType}.
 *
 * The wire values are a frozen contract shared with the UI and persisted in
 * MongoDB, so the literals are pinned here on purpose — renaming a value must
 * fail these tests, not slip through as a "refactor".
 *
 * Run with: ./gradlew test --tests "*.MethodTypeTest"
 */
class MethodTypeTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ── wire values (frozen contract) ─────────────────────────────────────────

    @ParameterizedTest
    @CsvSource({
            "CONNECTOR, CONNECTOR",
            "HTTP_REQUEST, HTTP_REQUEST",
            "WEBHOOK, WEBHOOK",
    })
    void getValueReturnsFrozenWireValueWhenConstantIsDefined(MethodType type, String wireValue) {
        assertThat(type.getValue()).isEqualTo(wireValue);
    }

    // ── fromValue ─────────────────────────────────────────────────────────────

    @ParameterizedTest
    @CsvSource({
            "CONNECTOR, CONNECTOR",
            "HTTP_REQUEST, HTTP_REQUEST",
            "WEBHOOK, WEBHOOK",
    })
    void fromValueReturnsConstantWhenValueIsKnown(String wireValue, MethodType expected) {
        assertThat(MethodType.fromValue(wireValue)).isEqualTo(expected);
    }

    @Test
    void fromValueReturnsNullWhenValueIsNull() {
        assertThat(MethodType.fromValue(null)).isNull();
    }

    @Test
    void fromValueThrowsIllegalArgumentExceptionWhenValueIsUnknown() {
        assertThatThrownBy(() -> MethodType.fromValue("WEBHOK"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("WEBHOK")
                .hasMessageContaining("CONNECTOR, HTTP_REQUEST, WEBHOOK");
    }

    @Test
    void fromValueThrowsIllegalArgumentExceptionWhenValueIsLowercase() {
        assertThatThrownBy(() -> MethodType.fromValue("connector"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("connector");
    }

    // ── Jackson contract ──────────────────────────────────────────────────────

    @Test
    void serializeWritesWireValueWhenConstantIsMarshalled() throws Exception {
        assertThat(objectMapper.writeValueAsString(MethodType.HTTP_REQUEST))
                .isEqualTo("\"HTTP_REQUEST\"");
    }

    @Test
    void deserializeReturnsConstantWhenJsonHoldsWireValue() throws Exception {
        assertThat(objectMapper.readValue("\"WEBHOOK\"", MethodType.class))
                .isEqualTo(MethodType.WEBHOOK);
    }

    @Test
    void deserializeThrowsWhenJsonValueIsUnknown() {
        assertThatThrownBy(() -> objectMapper.readValue("\"SOAP\"", MethodType.class))
                .isInstanceOf(ValueInstantiationException.class)
                .hasMessageContaining("SOAP")
                .hasMessageContaining("CONNECTOR, HTTP_REQUEST, WEBHOOK");
    }
}
