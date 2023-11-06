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
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngServiceImp;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import com.mongodb.MongoException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ConnectionServiceImp implements ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final ConnectorService connectorService;
    private final ConnectionMngService connectionMngService;
    private final SchedulerService schedulerService;
    private final EnhancementService enhancementService;
    private final Mapper<Connector, ConnectorDTO> connectorMapper;
    private final Mapper<ConnectorMng, ConnectorDTO> connectorMngMapper;

    public ConnectionServiceImp(
            ConnectionRepository connectionRepository,
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("connectionMngServiceImp") ConnectionMngServiceImp connectionMngService,
            @Lazy @Qualifier("schedulerServiceImp") SchedulerService schedulerService,
            @Qualifier("enhancementServiceImp")EnhancementService enhancementService,
            Mapper<Connector, ConnectorDTO> connectorMapper,
            Mapper<ConnectorMng, ConnectorDTO> connectorMngMapper) {
        this.connectionRepository = connectionRepository;
        this.connectorService = connectorService;
        this.schedulerService = schedulerService;
        this.connectionMngService = connectionMngService;
        this.enhancementService = enhancementService;
        this.connectorMapper = connectorMapper;
        this.connectorMngMapper = connectorMngMapper;
    }


    @Override
    @Transactional(rollbackFor = {MongoException.class, DataAccessException.class})
    public ConnectionMng save(Connection connection, ConnectionMng connectionMng) {

        Connector toConnector = connectorService.getById(connection.getToConnector());
        ConnectorMng toConnectorMng = connectorMngMapper.toEntity(connectorMapper.toDTO(toConnector));
        toConnectorMng.setMethods(connectionMng.getToConnector().getMethods());
        toConnectorMng.setOperators(connectionMng.getToConnector().getOperators());
        connectionMng.setToConnector(toConnectorMng);

        Connector fromConnector = connectorService.getById(connection.getFromConnector());
        ConnectorMng fromConnectorMng = connectorMngMapper.toEntity(connectorMapper.toDTO(fromConnector));
        fromConnectorMng.setMethods(connectionMng.getFromConnector().getMethods());
        fromConnectorMng.setOperators(connectionMng.getFromConnector().getOperators());
        connectionMng.setFromConnector(fromConnectorMng);
        //saving enhancements
//        List<Enhancement> savedEnhancements = enhancementService.saveAll(connection.getEnhancements());
//        connection.setEnhancements(savedEnhancements);

        //saving connection
        Connection savedConnection = connectionRepository.save(connection);
        connectionMng.setConnectionId(savedConnection.getId());

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
}
