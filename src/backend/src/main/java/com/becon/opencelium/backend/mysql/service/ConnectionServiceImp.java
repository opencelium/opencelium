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

package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.enums.ExecutionType;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.mysql.entity.*;
import com.becon.opencelium.backend.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.neo4j.entity.ConnectionNode;
import com.becon.opencelium.backend.neo4j.service.ConnectionNodeServiceImp;
import com.becon.opencelium.backend.neo4j.service.EnhancementNodeServiceImp;
import com.becon.opencelium.backend.resource.blayout.BusinessLayoutResource;
import com.becon.opencelium.backend.resource.connection.ConnectionResource;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
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
    private EnhancementNodeServiceImp enhancementNodeServiceImp;

    @Autowired
    private ConnectionNodeServiceImp connectionNodeService;

    @Lazy
    @Autowired
    private SchedulerServiceImp schedulerService;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private InvokerServiceImp invokerServiceImp;

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
    public void delete(Connection connection) {
        connectionRepository.delete(connection);
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
    public List<Connection> findAllByNameContains(String name) {
        return connectionRepository.findAllByNameContains(name);
    }

    @Override
    public boolean existsByName(String name) {
        return connectionRepository.existsByName(name);
    }

    private Map<Integer, List<RequestData>> getCtorsRequestData(ConnectionNode ctionNode) {
        Map<Integer, List<RequestData>> requestDataMap = new HashMap<>();
        int ctorId = ctionNode.getFromConnector().getConnectorId();
        List<RequestData> fromCtorReqData = connectorService.getRequestData(ctorId);
        requestDataMap.put(ctorId, fromCtorReqData);

        ctorId = ctionNode.getToConnector().getConnectorId();
        List<RequestData> toCtorReqData = connectorService.getRequestData(ctorId);
        requestDataMap.put(ctorId, toCtorReqData);

        return requestDataMap;
    }

    @Override
    public boolean existsById(Long id) {
        return connectionRepository.existsById(id);
    }

    @Override
    public List<Connection> findAllByConnectorId(int connectorId) {
        return connectionRepository.findAllByConnectorId(connectorId);
    }

    @Override
    public Connection toEntity(ConnectionResource resource) {
        Connection connection = new Connection();

        connection.setId(resource.getConnectionId());
        connection.setName(resource.getTitle());
        connection.setDescription(resource.getDescription());
        connection.setFromConnector(resource.getFromConnector().getConnectorId());
        connection.setToConnector(resource.getToConnector().getConnectorId());
        if (resource.getBusinessLayout() != null) {
            BusinessLayout businessLayout = new BusinessLayout(resource.getBusinessLayout(), connection);
            connection.setBusinessLayout(businessLayout);
        }
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
        if(connection.getBusinessLayout() != null) {
            connectionResource.setBusinessLayout(new BusinessLayoutResource(connection.getBusinessLayout()));
        }

        Connector from = connectorService.findById(connection.getFromConnector())
                .orElseThrow(() -> new RuntimeException("Connector - " + connection.getFromConnector() + " not found"));
        Connector to = connectorService.findById(connection.getToConnector())
                .orElseThrow(() -> new RuntimeException("Connector - " + connection.getToConnector() + " not found"));

        connectionResource.setFromConnector(connectorService.toNodeResource(from, connection.getId(), "from_connector"));
        connectionResource.setToConnector(connectorService.toNodeResource(to, connection.getId(), "to_connector"));
        return connectionResource;
    }

    @Override
    public ConnectionResource toResource(Connection connection) {
        ConnectionResource connectionResource = new ConnectionResource();
        connectionResource.setConnectionId(connection.getId());
        connectionResource.setTitle(connection.getName());
        connectionResource.setDescription(connection.getDescription());
        Connector from = connectorService.findById(connection.getFromConnector())
                .orElseThrow(() -> new RuntimeException("Connector - " + connection.getFromConnector() + " not found"));
        Connector to = connectorService.findById(connection.getToConnector())
                .orElseThrow(() -> new RuntimeException("Connector - " + connection.getToConnector() + " not found"));

        connectionResource.setFromConnector(connectorService.toMetaResource(from));
        connectionResource.setToConnector(connectorService.toMetaResource(to));
//        if (connection.getBusinessLayout() != null) {
//            connectionResource.setBusinessLayout(new BusinessLayoutResource(connection.getBusinessLayout()));
//        }
        return connectionResource;
    }
}
