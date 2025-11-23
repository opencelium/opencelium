package com.becon.opencelium.backend.mapper.v5;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.FlowchartMng;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.resource.connection.v5.ConnectionV5DTO;
import com.becon.opencelium.backend.resource.connection.v5.FlowchartDTO;
import com.becon.opencelium.backend.utility.StringUtility;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Mapper(
        componentModel = "spring",
        imports = {
                StringUtility.class,
        }
)
public abstract class ConnectionV5Mapper {

    @Autowired
    protected ConnectorService connectorService;

    @Autowired
    protected FlowchartMapper flowchartMapper;

    @Autowired
    protected MapperMapper mapperMapper;

    @Autowired
    protected ExecutionPlanMapper executionPlanMapper;

    @Mapping(target = "title", expression = "java(connection.getTitle())")
    @Mapping(target = "icon", expression = "java(StringUtility.resolveImagePath(connection.getIcon()))")
    @Mapping(target = "description", expression = "java(connection.getDescription())")
    @Mapping(target = "categoryId", expression = "java(connection.getCategoryId())")
    @Mapping(target = "mappers", expression = "java(mapperMapper.toDTOAll(connectionMng.getMappers()))")
    @Mapping(target = "flowcharts", expression = "java(mapFlowcharts(connectionMng.getFlowcharts()))")
    @Mapping(target = "executionPlan", expression = "java(executionPlanMapper.toDTO(connectionMng.getExecutionPlan()))")
    public abstract ConnectionV5DTO toDTO(ConnectionMng connectionMng, @Context Connection connection);

     protected List<FlowchartDTO> mapFlowcharts(List<FlowchartMng> flowcharts) {
        if (flowcharts == null || flowcharts.isEmpty()) {
            return List.of();
        }

        return flowcharts.stream()
                .map(fm -> {
                    var connector = connectorService.getById(fm.getConnectorId());
                    return flowchartMapper.toDTO(fm, connector);
                })
                .toList();
    }
}