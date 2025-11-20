package com.becon.opencelium.backend.mapper.v5;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.resource.connection.v5.ConnectionV5DTO;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(
        componentModel = "spring",
        uses = {
                FlowchartMapper.class,
                MapperMapper.class,
                ExecutionPlanMapper.class,
        }
)
public interface ConnectionV5Mapper {

    @Mapping(target = "categoryId", expression = "java(connection.getCategoryId())")
    @Mapping(target = "mappers", source = "mappers", qualifiedByName = {"mapperMapper", "toDTOAll"})
    @Mapping(target = "flowcharts", source = "flowcharts", qualifiedByName = {"flowchartMapper", "toDTOAll"})
    @Mapping(target = "executionPlan", source = "executionPlan", qualifiedByName = {"executionPlanMapper", "toDTO"})
    ConnectionV5DTO toDTO(ConnectionMng connectionMng, @Context Connection connection);
}
