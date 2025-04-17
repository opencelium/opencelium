package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;

public interface LogMetaDataService {
    void save(LogMetaData meta);
}