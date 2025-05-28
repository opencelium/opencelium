package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.constant.ExceptionMessages;
import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.database.mongodb.repository.LogMetaDataRepository;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.execution.log_managing.resource.MetaDataListDto;
import com.becon.opencelium.backend.mapper.base.Mapper;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class LogMetaDataServiceImpl implements LogMetaDataService {

    private final LogMetaDataRepository repository;
    private final Mapper<LogMetaData, MetaDataListDto> mapper;

    public LogMetaDataServiceImpl(LogMetaDataRepository repository, Mapper<LogMetaData, MetaDataListDto> mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public void save(LogMetaData meta) {
        repository.save(meta);
    }

    @Override
    public List<MetaDataListDto> getMetaDataList(String executionId) {
        return repository.findByExecutionIdAndIndexPathRegex(executionId, "^\\d+$")
                .stream()
                .map(mapper::toDTO)
                .toList();
    }

    @Override
    public List<MetaDataListDto> getMetaDataList(String executionId, String connectorId, String indexPath, String loopIndex) {
        LogMetaData loopElement = repository.findFirstByExecutionIdAndFlowchartIdAndIndexPath(executionId, connectorId, indexPath)
                .orElseThrow(() -> new GeneralServiceException(ExceptionConstant.INVALID_DATA, ExceptionMessages.LOG_ELEMENT_NOT_FOUND_WITH_INDEX_PATH.formatted(indexPath)));

        if (Objects.equals(loopElement.getType(), "loop")) {

            if (StringUtils.isBlank(loopIndex)) {

                throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, ExceptionMessages.LOOP_INDEX_IS_REQUIRED);
            }
        } else {
            // Skip loopIndex if it isn't 'loop' element

            loopIndex = null;
        }

        return repository.findByExecutionIdAndFlowchartIdAndParentPathAndLoopIndex(executionId, connectorId, indexPath, loopIndex)
                .stream()
                .map(mapper::toDTO)
                .toList();
    }
}