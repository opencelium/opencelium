package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.utils.HelperMapper;
import com.becon.opencelium.backend.mapper.utils.Wrapper;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        uses = {
                MethodMngMapper.class,
                OperatorMngMapper.class,
                HelperMapper.class
        }
)
@Named("connectorMngMapper")
public interface ConnectorMngMapper extends Mapper<ConnectorMng, ConnectorDTO> {

    @Named("toEntity")
    @Mappings({
            @Mapping(target = "methods", qualifiedByName = {"methodMngMapper","toEntityAll"}),
            @Mapping(target = "operators", qualifiedByName = {"operatorMngMapper","toEntityAll"})
    })
    ConnectorMng toEntity(ConnectorDTO connectorDTO);

    @Named("toDTO")
    default ConnectorDTO toDTO(ConnectorMng connectorMng){
        Wrapper<ConnectorDTO, ConnectorMng>  wrapper= new Wrapper<>(connectorMng);
        return toDTO(wrapper).getTo();
    }

    @Named("toEntityAll")
    default List<ConnectorMng> toEntityAll(List<ConnectorDTO> dtos) {
        return Mapper.super.toEntityAll(dtos);
    }

    @Named("toDTOAll")
    default List<ConnectorDTO> toDTOAll(List<ConnectorMng> entities) {
        return Mapper.super.toDTOAll(entities);
    }

    @Mapping(target = "to", source = "from",qualifiedByName ={"helperMapper","toConnectorDTO"})
    @Mapping(target = "from", ignore = true)
    Wrapper<ConnectorDTO, ConnectorMng> toDTO(Wrapper<ConnectorDTO,ConnectorMng> obj);
}
