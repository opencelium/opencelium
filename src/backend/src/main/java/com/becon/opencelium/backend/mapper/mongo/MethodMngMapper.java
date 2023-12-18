package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;

import java.util.List;


@org.mapstruct.Mapper(
        componentModel = "spring",
        uses = {
                RequestMngMapper.class,
                ResponseMngMapper.class
        }
)
@Named("methodMngMapper")
public interface MethodMngMapper extends Mapper<MethodMng, MethodDTO> {

    @Named("toEntity")
    @Mappings({
            @Mapping(target = "request", qualifiedByName = {"requestMngMapper", "toEntity"}),
            @Mapping(target = "response", qualifiedByName = {"responseMngMapper", "toEntity"})
    })
    MethodMng toEntity(MethodDTO methodDTO);
    @Named("toDTO")
    @Mappings({
            @Mapping(target = "request", qualifiedByName = {"requestMngMapper", "toDTO"}),
            @Mapping(target = "response", qualifiedByName = {"responseMngMapper", "toDTO"})
    })
    MethodDTO toDTO(MethodMng methodMng);

    @Named("toEntityAll")
    default List<MethodMng> toEntityAll(List<MethodDTO> dtos) {
        return Mapper.super.toEntityAll(dtos);
    }

    @Named("toDTOAll")
    default List<MethodDTO> toDTOAll(List<MethodMng> entities) {
        return Mapper.super.toDTOAll(entities);
    }
}
