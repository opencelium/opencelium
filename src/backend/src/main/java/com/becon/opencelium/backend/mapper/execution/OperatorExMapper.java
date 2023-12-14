package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {
                ConditionExMapper.class
        }
)
@Named("operatorExMapper")
public interface OperatorExMapper extends Mapper<OperatorEx, OperatorMng> {

    @Mapping(target = "condition", qualifiedByName = {"conditionExMapper","toEntity"})
    @Named("toEntity")
    OperatorEx toEntity(OperatorMng dto);

    OperatorMng toDTO(OperatorEx entity);

    @Named("toEntityAll")
    @Override
    default List<OperatorEx> toEntityAll(List<OperatorMng> dtos) {
        return Mapper.super.toEntityAll(dtos);
    }

    @Override
    default List<OperatorMng> toDTOAll(List<OperatorEx> entities) {
        return Mapper.super.toDTOAll(entities);
    }
}
