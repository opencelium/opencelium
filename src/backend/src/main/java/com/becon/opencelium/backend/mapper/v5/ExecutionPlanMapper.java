package com.becon.opencelium.backend.mapper.v5;

import com.becon.opencelium.backend.database.mongodb.entity.ExecutionPlanMng;
import com.becon.opencelium.backend.resource.connection.v5.ExecutionPlanDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring", uses = {OnErrorMapper.class})
@Named("executionPlanMapper")
public interface ExecutionPlanMapper {

    @Named("toDTO")
    @Mapping(target = "onError", source = "onError", qualifiedByName = {"onErrorMapper", "toDTO"})
    ExecutionPlanDTO toDTO(ExecutionPlanMng  executionPlan);
}
