/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.constant.Constant;
import com.becon.opencelium.backend.exception.ConnectorNotFoundException;
import com.becon.opencelium.backend.mysql.entity.Connection;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.Scheduler;
import com.becon.opencelium.backend.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.mysql.service.EnhancementServiceImp;
import com.becon.opencelium.backend.neo4j.entity.ConnectionNode;
import com.becon.opencelium.backend.neo4j.service.ConnectionNodeServiceImp;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;


//@Service
public class ConnectionExecutor {

    private ConnectionNodeServiceImp connectionNodeService;
    private ConnectorServiceImp connectorService;
    private ExecutionContainer executionContainer;
    private ConnectorExecutor connectorExecutor;
    private boolean debugMode;

    public ConnectionExecutor(ConnectionNodeServiceImp connectionNodeService, ConnectorServiceImp connectorService,
                              ExecutionContainer executionContainer, ConnectorExecutor connectorExecutor) {
        this.connectionNodeService = connectionNodeService;
        this.connectorService = connectorService;
        this.executionContainer = executionContainer;
        this.connectorExecutor = connectorExecutor;
        this.debugMode = debugMode;
    }

    public void start(Scheduler scheduler) throws Exception{
        executionContainer.setMethodResponses(new ArrayList<>());

        Connection connection = scheduler.getConnection();
        ConnectionNode connectionNode = connectionNodeService.findByConnectionId(connection.getId())
                .orElseThrow(() -> new RuntimeException("Connection not found by id - " + connection.getId()));

        Connector fromConnector = connectorService.findById(connection.getFromConnector())
                .orElseThrow(() -> new ConnectorNotFoundException(connection.getFromConnector()));

        Connector toConnector = connectorService.findById(connection.getToConnector())
                .orElseThrow(() -> new ConnectorNotFoundException(connection.getFromConnector()));


        connectorExecutor.start(connectionNode.getFromConnector(), fromConnector, toConnector,
                                Constant.CONN_FROM);
        connectorExecutor.start(connectionNode.getToConnector(), toConnector, fromConnector,
                                Constant.CONN_TO);
    }
}
