package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.utils.OperationMappingHelper;
import com.becon.opencelium.backend.mapper.utils.Wrapper;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import org.mapstruct.Mapping;


@org.mapstruct.Mapper(
        componentModel = "spring",
        uses = OperationMappingHelper.class
)
public interface OperationMngMapper extends Mapper<MethodMng, OperationDTO> {
    default MethodMng toEntity(OperationDTO dto){
        return new MethodMng();
    }
    default OperationDTO toDTO(MethodMng entity){
        Wrapper<OperationDTO, MethodMng> wrapper = new Wrapper<>(entity);
        return toDTO(wrapper).getTo();
    }

    @Mapping(target = "to", source = "from",qualifiedByName ={"OperationMappingHelper","toOperation"})
    @Mapping(target = "from", ignore = true)
    Wrapper<OperationDTO,MethodMng> toDTO(Wrapper<OperationDTO,MethodMng> obj);
}

