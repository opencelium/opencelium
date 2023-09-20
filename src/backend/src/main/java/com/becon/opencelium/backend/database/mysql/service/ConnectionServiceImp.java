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

package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.service.*;
import com.becon.opencelium.backend.database.mysql.entity.*;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ConnectionServiceImp implements ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final ConnectorService connectorService;
    private final EnhancementService enhancementService;
    private final EnhancementMngService enhancementMngService;
    private final ConnectionMngService connectionMngService;
    private final SchedulerService schedulerService;
    private final ConnectorMngService connectorMngService;

    public ConnectionServiceImp(
            ConnectionRepository connectionRepository,
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("enhancementServiceImp") EnhancementService enhancementService,
            @Qualifier("enhancementMngServiceImp") EnhancementMngServiceImp enhancementMngService,
            @Qualifier("connectionMngServiceImp") ConnectionMngServiceImp connectionMngService,
            @Lazy @Qualifier("schedulerServiceImp") SchedulerService schedulerService,
            @Qualifier("connectorMngServiceImp") ConnectorMngServiceImp connectorMngService) {
        this.connectionRepository = connectionRepository;
        this.connectorService = connectorService;
        this.enhancementService = enhancementService;
        this.schedulerService = schedulerService;
        this.enhancementMngService = enhancementMngService;
        this.connectionMngService = connectionMngService;
        this.connectorMngService = connectorMngService;
    }


    @Override
    public ConnectionMng save(Connection connection, ConnectionMng connectionMng) {

        Connector toConnector = connectorService.getById(connection.getToConnector());
        ConnectorMng toConnectorMng = connectorMngService.toEntity(toConnector);
        toConnectorMng.setMethods(connectionMng.getToConnector().getMethods());
        toConnectorMng.setOperators(connectionMng.getToConnector().getOperators());
        connectionMng.setToConnector(toConnectorMng);

        Connector fromConnector = connectorService.getById(connection.getFromConnector());
        ConnectorMng fromConnectorMng = connectorMngService.toEntity(fromConnector);
        fromConnectorMng.setMethods(connectionMng.getFromConnector().getMethods());
        fromConnectorMng.setOperators(connectionMng.getFromConnector().getOperators());
        connectionMng.setFromConnector(fromConnectorMng);


        //saving connection
        Connection savedConnection = connectionRepository.save(connection);
        connectionMng.setConnectionId(savedConnection.getId());

        //setting enhancements to connection and enhancementId to all fieldBindingMng's enhancementMng
        for (FieldBindingMng fieldBindingMng : connectionMng.getFieldBinding()) {
            Enhancement enhancement = enhancementMngService.toEntity(fieldBindingMng.getEnhancement());
            enhancement.setConnection(savedConnection);
            Enhancement savedEnhancement = enhancementService.save(enhancement);
            fieldBindingMng.getEnhancement().setEnhancementId(savedEnhancement.getId());
        }

        //saving connectionMng
        return connectionMngService.save(connectionMng);
    }

    @Override
    public void deleteById(Long id) {
        Connection connection = getById(id);
        List<Scheduler> schedulers = connection.getSchedulers();

        if (schedulers != null && !schedulers.isEmpty()) {
            schedulers.forEach(s -> {
                schedulerService.deleteById(s.getId());
            });
        }
        connectionRepository.deleteById(id);
        connectionMngService.delete(id);
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

    @Override
    public boolean existsById(Long id) {
        return connectionRepository.existsById(id);
    }

    @Override
    public List<Connection> findAllByConnectorId(int connectorId) {
        return connectionRepository.findAllByConnectorId(connectorId);
    }

    @Override
    public ConnectionMng update(Connection connection, ConnectionMng uConnectionMng) {
        Connection rConnection = getById(connection.getId());
        connection.setIcon(rConnection.getIcon());
        ConnectionMng connectionMng = connectionMngService.getByConnectionId(connection.getId());
        uConnectionMng.setId(connectionMng.getId());
        return save(connection, uConnectionMng);
    }

    @Override
    public Connection getById(Long id) {
        return connectionRepository.findById(id)
                .orElseThrow(() -> new ConnectionNotFoundException(id));
    }


    @Override
    public Connection toEntity(ConnectionDTO connectionDTO) {
        Connection connection = new Connection();

        connection.setId(connectionDTO.getConnectionId());
        connection.setName(connectionDTO.getTitle());
        connection.setDescription(connectionDTO.getDescription());
        connection.setFromConnector(connectionDTO.getFromConnector().getConnectorId());
        connection.setToConnector(connectionDTO.getToConnector().getConnectorId());
//        connection.setEnhancements(connectionDTO.getFieldBinding().stream().map(e->enhancementService.toEntity(e.getEnhancement())).toList());
        if (connectionDTO.getBusinessLayout() != null) {
            BusinessLayout businessLayout = new BusinessLayout(connectionDTO.getBusinessLayout(), connection);
            connection.setBusinessLayout(businessLayout);
        }
        return connection;
    }

    @Override
    public ConnectionDTO toDTO(Connection connection) {
        ConnectionDTO connectionResource = new ConnectionDTO();
        connectionResource.setConnectionId(connection.getId());
        connectionResource.setTitle(connection.getName());
        connectionResource.setDescription(connection.getDescription());
        Connector from = connectorService.getById(connection.getFromConnector());
        Connector to = connectorService.getById(connection.getToConnector());
        connectionResource.setFromConnector(connectorService.toMetaDTO(from));
        connectionResource.setToConnector(connectorService.toMetaDTO(to));
//        if (connection.getBusinessLayout() != null) {
//            connectionResource.setBusinessLayout(new BusinessLayoutResource(connection.getBusinessLayout()));
//        }
        return connectionResource;
    }

    @Override
    public List<ConnectionDTO> toDTOAll(List<Connection> connections) {
        ArrayList<ConnectionDTO> connectionDTOS = new ArrayList<>();
        for (Connection connection : connections) {
            connectionDTOS.add(toDTO(connection));
        }
        return connectionDTOS;
    }
}
