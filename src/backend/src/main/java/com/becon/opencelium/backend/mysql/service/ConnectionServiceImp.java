/*
 * // Copyright (C) <2019> <becon GmbH>
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

package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.Connection;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.Scheduler;
import com.becon.opencelium.backend.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.neo4j.entity.ConnectionNode;
import com.becon.opencelium.backend.neo4j.service.ConnectionNodeServiceImp;
import com.becon.opencelium.backend.quartz.QuartzUtility;
import com.becon.opencelium.backend.resource.connection.ConnectionResource;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ConnectionServiceImp implements ConnectionService{

    @Autowired
    private ConnectionRepository connectionRepository;

    @Autowired
    private ConnectorServiceImp connectorService;

    @Autowired
    private EnhancementServiceImp enhancementService;

    @Autowired
    private ConnectionNodeServiceImp connectionNodeService;

    @Autowired
    private SchedulerServiceImp schedulerService;

    @Override
    public void save(Connection connection) {
        connectionRepository.save(connection);
    }

    @Override
    public void deleteById(Long id) {
        Connection connection = connectionRepository.findById(id).get();
        List<Scheduler> schedulers = connection.getSchedulers();

        if (schedulers != null && !schedulers.isEmpty()){
            schedulers.forEach(s -> {
                schedulerService.deleteById(s.getId());
            });
        }
        connectionRepository.deleteById(id);
    }

    @Override
    public Optional<Connection> findById(Long id) {
        return connectionRepository.findById(id);
    }

    @Override
    public List<Connection> findAll() {
        return connectionRepository.findAll();
    }

    @Override
    public void execute(Long connectionId, int schedulerId) {
        Connection connection = findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection - " + connectionId + " not found."));

        ConnectionNode connectionNode = connectionNodeService.findByConnectionId(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection - " + connectionId + " not found."));

        connectionNode.getToConnector();
    }

    @Override
    public Connection toEntity(ConnectionResource resource) {
        Connection connection = new Connection();

        connection.setId(resource.getConnectionId());
        connection.setName(resource.getTitle());
        connection.setDescription(resource.getDescription());
        connection.setFromConnector(resource.getFromConnector().getConnectorId());
        connection.setToConnector(resource.getToConnector().getConnectorId());
        return connection;
    }

    @Override
    public ConnectionResource toNodeResource(Connection connection) {
        ConnectionResource connectionResource = new ConnectionResource();
        List<FieldBindingResource> fieldBindingResources = new ArrayList<>();
        if (connection.getEnhancements() != null) {
            fieldBindingResources = connection.getEnhancements().stream()
                    .map(e -> enhancementService.toFieldBindingResource(e)).collect(Collectors.toList());
        }

        connectionResource.setConnectionId(connection.getId());
        connectionResource.setTitle(connection.getName());
        connectionResource.setDescription(connection.getDescription());
        connectionResource.setFieldBinding(fieldBindingResources);

        Connector from = connectorService.findById(connection.getFromConnector())
                .orElseThrow(() -> new RuntimeException("Connector - " + connection.getFromConnector() + " not found"));
        Connector to = connectorService.findById(connection.getToConnector())
                .orElseThrow(() -> new RuntimeException("Connector - " + connection.getToConnector() + " not found"));

        connectionResource.setFromConnector(connectorService.toNodeResource(from, connection.getId()));
        connectionResource.setToConnector(connectorService.toNodeResource(to, connection.getId()));
        return connectionResource;
    }

    @Override
    public ConnectionResource toResource(Connection connection) {
        ConnectionResource connectionResource = new ConnectionResource();
        connectionResource.setConnectionId(connection.getId());
        connectionResource.setTitle(connection.getName());
        connectionResource.setDescription(connection.getDescription());
        return connectionResource;
    }
}
