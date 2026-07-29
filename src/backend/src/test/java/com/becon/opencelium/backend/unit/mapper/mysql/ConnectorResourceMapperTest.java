/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.enums.ConnectorStatus;
import com.becon.opencelium.backend.mapper.mysql.ConnectorResourceMapper;
import com.becon.opencelium.backend.mapper.mysql.ConnectorResourceMapperImpl;
import com.becon.opencelium.backend.mapper.mysql.RequestDataMapper;
import com.becon.opencelium.backend.mapper.utils.HelperMapper;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link ConnectorResourceMapper}, focused on the connector
 * health fields introduced with OC-1515.
 *
 * Runs the MapStruct-generated {@code ConnectorResourceMapperImpl} directly,
 * wired to Mockito mocks for {@link HelperMapper} and {@link RequestDataMapper}
 * via {@link ReflectionTestUtils} — the invoker/request-data mappings are those
 * collaborators' concern, not this test's.
 *
 * Pinned contract: entity → DTO carries {@code status} through as the enum,
 * converts {@code lastCheckedAt} to epoch millis (null-safe), and passes
 * {@code lastTestError} through; DTO → entity deliberately ignores the health
 * fields so client input can never overwrite backend-owned state.
 *
 * Run with: ./gradlew test --tests "*.ConnectorResourceMapperTest"
 */
@ExtendWith(MockitoExtension.class)
class ConnectorResourceMapperTest {

    @Mock
    private HelperMapper helperMapper;

    @Mock
    private RequestDataMapper requestDataMapper;

    private ConnectorResourceMapperImpl mapper;

    @BeforeEach
    void setUp() {
        mapper = new ConnectorResourceMapperImpl();
        ReflectionTestUtils.setField(mapper, "helperMapper", helperMapper);
        ReflectionTestUtils.setField(mapper, "requestDataMapper", requestDataMapper);
    }

    // ── toDTO — health fields ─────────────────────────────────────────────────

    @Test
    void toDtoMapsStatusWhenEntityHasStatus() {
        Connector entity = aConnector();
        entity.setStatus(ConnectorStatus.AUTH_FAILED);

        ConnectorResource dto = mapper.toDTO(entity);

        assertThat(dto.getStatus()).isEqualTo(ConnectorStatus.AUTH_FAILED);
    }

    @Test
    void toDtoMapsStatusToNullWhenEntityStatusIsNull() {
        Connector entity = aConnector();

        ConnectorResource dto = mapper.toDTO(entity);

        // @JsonInclude(NON_NULL) on the DTO omits a null status from the JSON.
        assertThat(dto.getStatus()).isNull();
    }

    @Test
    void toDtoConvertsLastCheckedAtToEpochMillisWhenEntityHasTimestamp() {
        Connector entity = aConnector();
        entity.setLastCheckedAt(new Date(1_722_249_600_000L));

        ConnectorResource dto = mapper.toDTO(entity);

        assertThat(dto.getLastCheckedAt()).isEqualTo(1_722_249_600_000L);
    }

    @Test
    void toDtoMapsLastCheckedAtToNullWhenEntityWasNeverChecked() {
        Connector entity = aConnector();

        ConnectorResource dto = mapper.toDTO(entity);

        assertThat(dto.getLastCheckedAt()).isNull();
    }

    @Test
    void toDtoMapsLastTestErrorWhenEntityHasError() {
        Connector entity = aConnector();
        entity.setStatus(ConnectorStatus.DOWN);
        entity.setLastTestError("connect timed out");

        ConnectorResource dto = mapper.toDTO(entity);

        assertThat(dto.getLastTestError()).isEqualTo("connect timed out");
    }

    // ── toEntity — health fields are backend-owned ────────────────────────────

    @Test
    void toEntityIgnoresStatusWhenDtoCarriesStatus() {
        ConnectorResource dto = aResource();
        dto.setStatus(ConnectorStatus.UP);

        Connector entity = mapper.toEntity(dto);

        assertThat(entity.getStatus()).isNull();
    }

    @Test
    void toEntityIgnoresLastCheckedAtWhenDtoCarriesTimestamp() {
        ConnectorResource dto = aResource();
        dto.setLastCheckedAt(1_722_249_600_000L);

        Connector entity = mapper.toEntity(dto);

        assertThat(entity.getLastCheckedAt()).isNull();
    }

    // ── dateToEpochMillis — the @Named conversion itself ──────────────────────

    @Test
    void dateToEpochMillisReturnsMillisWhenDateIsPresent() {
        assertThat(ConnectorResourceMapper.dateToEpochMillis(new Date(42L))).isEqualTo(42L);
    }

    @Test
    void dateToEpochMillisReturnsNullWhenDateIsNull() {
        assertThat(ConnectorResourceMapper.dateToEpochMillis(null)).isNull();
    }

    // ── fixtures ──────────────────────────────────────────────────────────────

    private static Connector aConnector() {
        Connector connector = new Connector();
        connector.setId(7);
        connector.setTitle("jira");
        connector.setInvoker("Jira");
        return connector;
    }

    private static ConnectorResource aResource() {
        ConnectorResource dto = new ConnectorResource();
        dto.setConnectorId(7);
        dto.setTitle("jira");
        return dto;
    }
}
