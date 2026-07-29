/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.execution.socket;

import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorHealthService.CheckResult;
import com.becon.opencelium.backend.enums.ConnectorStatus;
import com.becon.opencelium.backend.execution.socket.ConnectorStatusPublisher;
import com.becon.opencelium.backend.execution.socket.SocketConstant;
import com.becon.opencelium.backend.mapper.mysql.ConnectorResourceMapper;
import com.becon.opencelium.backend.resource.connector.ConnectorMetaDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ConnectorStatusPublisher}.
 *
 * Pinned contract: exactly one message per {@code onStatusTransition} call, sent to
 * {@link SocketConstant#CONNECTOR_STATUS_DESTINATION}, carrying the freshly persisted
 * state — the transitioned status, the check's error (cleared on UP), and the check's
 * timestamp — overlaid on the mapped meta view. The publisher itself never fires
 * without a transition because it is only reachable through the
 * {@code ConnectorStatusListener} callback (covered by ConnectorHealthServiceImpTest).
 *
 * Run with: ./gradlew test --tests "*.ConnectorStatusPublisherTest"
 */
@ExtendWith(MockitoExtension.class)
class ConnectorStatusPublisherTest {

    @Mock
    private SimpMessagingTemplate simpMessagingTemplate;

    @Mock
    private ConnectorResourceMapper connectorResourceMapper;

    private ConnectorStatusPublisher publisher;

    private Connector connector;

    @BeforeEach
    void setUp() {
        publisher = new ConnectorStatusPublisher(simpMessagingTemplate, connectorResourceMapper);
        connector = new Connector();
        connector.setId(7);
        connector.setTitle("jira");
        connector.setInvoker("Jira");
        ConnectorMetaDTO mapped = new ConnectorMetaDTO();
        mapped.setConnectorId(7);
        mapped.setTitle("jira");
        // Stale values from the entity as loaded before the check — must be overlaid.
        mapped.setStatus(ConnectorStatus.UP);
        mapped.setLastTestError(null);
        when(connectorResourceMapper.toMetaDTO(connector)).thenReturn(mapped);
    }

    @Test
    void onStatusTransitionPublishesExactlyOneMessageToStatusTopicWhenCalled() {
        publisher.onStatusTransition(connector, ConnectorStatus.DOWN, aResult(ConnectorStatus.DOWN, "refused"));

        verify(simpMessagingTemplate, times(1))
                .convertAndSend(eq(SocketConstant.CONNECTOR_STATUS_DESTINATION), any(ConnectorMetaDTO.class));
    }

    @Test
    void onStatusTransitionOverlaysPersistedStateWhenStatusIsDown() {
        publisher.onStatusTransition(connector, ConnectorStatus.DOWN, aResult(ConnectorStatus.DOWN, "refused"));

        ConnectorMetaDTO sent = capturePublishedMeta();
        assertThat(sent.getConnectorId()).isEqualTo(7);
        assertThat(sent.getStatus()).isEqualTo(ConnectorStatus.DOWN);
        assertThat(sent.getLastTestError()).isEqualTo("refused");
        assertThat(sent.getLastCheckedAt()).isEqualTo(1_722_249_600_000L);
    }

    @Test
    void onStatusTransitionClearsErrorWhenStatusIsUp() {
        publisher.onStatusTransition(connector, ConnectorStatus.UP, aResult(ConnectorStatus.UP, "stale error"));

        ConnectorMetaDTO sent = capturePublishedMeta();
        assertThat(sent.getStatus()).isEqualTo(ConnectorStatus.UP);
        assertThat(sent.getLastTestError()).isNull();
    }

    private ConnectorMetaDTO capturePublishedMeta() {
        ArgumentCaptor<ConnectorMetaDTO> captor = ArgumentCaptor.forClass(ConnectorMetaDTO.class);
        verify(simpMessagingTemplate)
                .convertAndSend(eq(SocketConstant.CONNECTOR_STATUS_DESTINATION), captor.capture());
        return captor.getValue();
    }

    private static CheckResult aResult(ConnectorStatus status, String error) {
        return new CheckResult(status, error, 12, new Date(1_722_249_600_000L),
                status == ConnectorStatus.UP ? HttpStatus.OK : null);
    }
}
