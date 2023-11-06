package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.repository.ConnectionMngRepository;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConnectionMngServiceImp implements ConnectionMngService{
    private final ConnectionMngRepository connectionMngRepository;

    public ConnectionMngServiceImp(
            ConnectionMngRepository connectionMngRepository
    ) {
        this.connectionMngRepository = connectionMngRepository;
    }

    @Override
    public ConnectionMng save(ConnectionMng connectionMng) {
        return connectionMngRepository.save(connectionMng);
    }

    @Override
    public ConnectionMng getByConnectionId(Long connectionId) {
        return connectionMngRepository.findByConnectionId(connectionId)
                .orElseThrow(()-> new ConnectionNotFoundException(connectionId));
    }

    @Override
    public List<ConnectionMng> getAll() {
        return connectionMngRepository.findAll();
    }

    @Override
    public void delete(Long id) {
        connectionMngRepository.delete(getByConnectionId(id));
    }

}
