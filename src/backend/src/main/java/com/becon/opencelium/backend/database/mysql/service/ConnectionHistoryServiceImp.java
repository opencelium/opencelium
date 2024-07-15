package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.ConnectionHistory;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionHistoryRepository;
import com.becon.opencelium.backend.enums.Action;
import com.becon.opencelium.backend.security.UserPrincipals;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.fge.jsonpatch.JsonPatch;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConnectionHistoryServiceImp implements ConnectionHistoryService {
    @Value("${" + AppYamlPath.OC_VERSION + "}")
    private String ocVersion;
    private final ObjectMapper mapper;
    private final ConnectionHistoryRepository connectionHistoryRepository;

    public ConnectionHistoryServiceImp(ObjectMapper mapper, ConnectionHistoryRepository connectionHistoryRepository) {
        this.mapper = mapper;
        this.connectionHistoryRepository = connectionHistoryRepository;
    }

    @Override
    public List<ConnectionHistory> findAllWithInterval(long connectionId, long second) {
        return connectionHistoryRepository.findConnectionHistoriesInInterval(connectionId, second);
    }

    @Override
    public List<ConnectionHistory> findAllWithConnectionId(Long connectionId) {
        return connectionHistoryRepository.findAllByConnectionId(connectionId);
    }

    @Override
    public ConnectionHistory makeHistoryAndSave(Connection connection, JsonPatch jsonPatch, Action action) {
        ConnectionHistory connectionHistory = new ConnectionHistory();
        UserPrincipals details = (UserPrincipals) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        connectionHistory.setUser(details.getUser());
        connectionHistory.setOcVersion(ocVersion);
        connectionHistory.setConnection(connection);
        connectionHistory.setAction(action);
        try {
            connectionHistory.setJsonPatch((jsonPatch != null) ? mapper.writeValueAsString(jsonPatch) : null);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        return connectionHistoryRepository.save(connectionHistory);
    }

    @Override
    public ConnectionHistory makeHistoryAndSave(Long connectionId, JsonPatch jsonPatch, Action action) {
        Connection connection = new Connection();
        connection.setId(connectionId);
        return makeHistoryAndSave(connection, jsonPatch, action);
    }
}
