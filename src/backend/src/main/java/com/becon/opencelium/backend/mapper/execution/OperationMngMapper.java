package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.utils.OperationMappingHelper;
import com.becon.opencelium.backend.mapper.utils.Wrapper;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;


@org.mapstruct.Mapper(
        componentModel = "spring",
        uses = OperationMappingHelper.class
)
@Named("operationMngMapper")
public interface OperationMngMapper extends Mapper<OperationDTO, MethodMng> {
    @Override
    default MethodMng toDTO(OperationDTO dto){
        return null;
    }

    @Named("toEntity")
    @Override
    default OperationDTO toEntity(MethodMng entity){
        Wrapper<OperationDTO, MethodMng> wrapper = new Wrapper<>(entity);
        return toDTO(wrapper).getTo();
    }

    @Mapping(target = "to", source = "from",qualifiedByName ={"OperationMappingHelper","toOperation"})
    @Mapping(target = "from", ignore = true)
    Wrapper<OperationDTO,MethodMng> toDTO(Wrapper<OperationDTO,MethodMng> obj);

    @Override
    @Named("toEntityAll")
    default List<OperationDTO> toEntityAll(List<MethodMng> dtos) {
        return Mapper.super.toEntityAll(dtos);
    }
}

