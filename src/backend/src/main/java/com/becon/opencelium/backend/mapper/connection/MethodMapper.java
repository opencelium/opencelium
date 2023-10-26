package com.becon.opencelium.backend.mapper.connection;

import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Mapper(
        componentModel = "spring",
        injectionStrategy = InjectionStrategy.FIELD,
        uses = {
                RequestMapper.class, ResponseMapper.class, OperationMappingHelper.class
        }
)
@Named("methodMapper")
public abstract class MethodMapper {
    @Autowired
    private OperationMappingHelper mappingHelper;

    @Named("toEntity")
    @Mappings({
            @Mapping(target = "id", source = "nodeId"),
            @Mapping(target = "request", qualifiedByName = {"requestMapper", "toEntity"}),
            @Mapping(target = "response", qualifiedByName = {"responseMapper", "toEntity"})
    })
    public abstract MethodMng toEntity(MethodDTO methodDTO);

    @Named("toDTO")
    @Mappings({
            @Mapping(target = "nodeId", source = "id"),
            @Mapping(target = "request", qualifiedByName = {"requestMapper", "toDTO"}),
            @Mapping(target = "response", qualifiedByName = {"responseMapper", "toDTO"})
    })
    public abstract MethodDTO toDTO(MethodMng methodMng);

    public OperationDTO toOperation(MethodMng methodMng) {
        return mappingHelper.toOperation(methodMng);
    }

    @Named("toEntityAll")
    @IterableMapping(qualifiedByName = "toEntity")
    public abstract List<MethodMng> toEntityAll(List<MethodDTO> methodDTOs);

    @Named("toDTOAll")
    @IterableMapping(qualifiedByName = "toDTO")
    public abstract List<MethodDTO> toDTOAll(List<MethodMng> methodMngs);
}
