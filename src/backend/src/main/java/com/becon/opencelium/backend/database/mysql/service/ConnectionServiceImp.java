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
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngServiceImp;
import com.becon.opencelium.backend.database.mongodb.service.FieldBindingMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
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
    private final FieldBindingMngService fieldBindingMngService;
    private final SchedulerService schedulerService;
    private final EnhancementService enhancementService;

    public ConnectionServiceImp(
            ConnectionRepository connectionRepository,
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("connectionMngServiceImp") ConnectionMngServiceImp connectionMngService,
            @Qualifier("fieldBindingMngServiceImp") FieldBindingMngService fieldBindingMngService,
            @Lazy @Qualifier("schedulerServiceImp") SchedulerService schedulerService,
            @Qualifier("enhancementServiceImp") EnhancementService enhancementService
    ) {
        this.connectionRepository = connectionRepository;
        this.connectorService = connectorService;
        this.fieldBindingMngService = fieldBindingMngService;
        this.schedulerService = schedulerService;
        this.connectionMngService = connectionMngService;
        this.enhancementService = enhancementService;
    }


    @Override
    @Transactional(rollbackFor = {MongoException.class, DataAccessException.class})
    public ConnectionMng save(Connection connection, ConnectionMng connectionMng) {

        connectorService.getById(connection.getToConnector());
        connectorService.getById(connection.getFromConnector());

        //bind fields
        fieldBindingMngService.bind(connectionMng);

        List<Enhancement> enhancements = connection.getEnhancements();
        connection.setEnhancements(null);

        //saving connection
        Connection savedConnection = connectionRepository.save(connection);

        //saving enhancements
        enhancements.forEach(enhancement -> enhancement.setConnection(savedConnection));
        enhancementService.saveAll(enhancements);

        //saving connectionMng
        connectionMng.setConnectionId(savedConnection.getId());
        return connectionMngService.save(connectionMng);
    }

    @Override
    public Long createEmptyConnection() {
        Connection saved = connectionRepository.save(new Connection());
        ConnectionMng connectionMng = new ConnectionMng();
        connectionMng.setConnectionId(saved.getId());
        connectionMngService.save(connectionMng);
        return saved.getId();
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
        getById(connection.getId());
        connectionMngService.getByConnectionId(connection.getId());
        return save(connection, uConnectionMng);
    }

    @Override
    public Connection getById(Long id) {
        return connectionRepository.findById(id)
                .orElseThrow(() -> new ConnectionNotFoundException(id));
    }
}
