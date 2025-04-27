package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.database.mongodb.repository.LogMetaDataRepository;
import org.springframework.stereotype.Service;

@Service
public class LogMetaDataServiceImpl implements LogMetaDataService {

    private final LogMetaDataRepository repository;

    public LogMetaDataServiceImpl(LogMetaDataRepository repository) {
        this.repository = repository;
    }

    @Override
    public void save(LogMetaData meta) {
        repository.save(meta);
    }
}