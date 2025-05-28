package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.log_managing.resource.MetaDataListDto;

import java.util.List;

public interface LogMetaDataService {
    void save(LogMetaData meta);

    List<MetaDataListDto> getMetaDataList(String executionId);

    List<MetaDataListDto> getMetaDataList(String executionId, String connectorId, String indexPath, String loopIndex);
}