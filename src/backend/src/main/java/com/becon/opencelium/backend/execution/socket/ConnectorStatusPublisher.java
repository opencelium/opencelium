/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.execution.socket;

import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorHealthService.CheckResult;
import com.becon.opencelium.backend.database.mysql.service.ConnectorStatusListener;
import com.becon.opencelium.backend.enums.ConnectorStatus;
import com.becon.opencelium.backend.mapper.mysql.ConnectorResourceMapper;
import com.becon.opencelium.backend.resource.connector.ConnectorMetaDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Broadcasts damped connector status transitions to the
 * {@link SocketConstant#CONNECTOR_STATUS_DESTINATION} WebSocket topic.
 *
 * <p>Wired into {@link com.becon.opencelium.backend.database.mysql.service.ConnectorHealthService}
 * as the {@link ConnectorStatusListener}, which invokes it exactly once per transition and
 * strictly after the new status has been persisted.
 */
@Component
public class ConnectorStatusPublisher implements ConnectorStatusListener {

    private final SimpMessagingTemplate simpMessagingTemplate;
    private final ConnectorResourceMapper connectorResourceMapper;

    public ConnectorStatusPublisher(
            SimpMessagingTemplate simpMessagingTemplate,
            ConnectorResourceMapper connectorResourceMapper
    ) {
        this.simpMessagingTemplate = simpMessagingTemplate;
        this.connectorResourceMapper = connectorResourceMapper;
    }

    @Override
    public void onStatusTransition(Connector connector, ConnectorStatus newStatus, CheckResult result) {
        // The connector object predates the write, so overlay the freshly persisted state.
        ConnectorMetaDTO meta = connectorResourceMapper.toMetaDTO(connector);
        meta.setStatus(newStatus);
        meta.setLastTestError(newStatus == ConnectorStatus.UP ? null : result.error());
        meta.setLastCheckedAt(result.checkedAt() == null ? null : result.checkedAt().getTime());
        simpMessagingTemplate.convertAndSend(SocketConstant.CONNECTOR_STATUS_DESTINATION, meta);
    }
}
