package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.utils.HelperMapper;
import com.becon.opencelium.backend.mapper.utils.Wrapper;
import com.becon.opencelium.backend.resource.execution.ConnectorEx;
import org.mapstruct.*;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {
                OperatorExMapper.class,
                HelperMapper.class
        }
)
@Named("connectorExMapper")
public interface ConnectorExMapper extends Mapper<ConnectorEx, ConnectorMng> {

    @Named("toEntity")
    @Mappings({
            @Mapping(target = "id", source = "connectorId"),
            @Mapping(target = "methods", ignore = true),
            @Mapping(target = "operators", qualifiedByName = {"operatorExMapper", "toEntityAll"})
    })
    ConnectorEx toEntity(ConnectorMng dto);

    @AfterMapping
    default void afterMapping(@MappingTarget ConnectorEx entity, ConnectorMng dto) {
        Wrapper<ConnectorMng, ConnectorEx> wrapper = new Wrapper<>(entity);
        wrapper.setTo(dto);
        setAdditionalFields(wrapper);
        mapMethodsOfConnector(wrapper);
    }

    default ConnectorMng toDTO(ConnectorEx entity) {
        return null;
    }

    @Mapping(target = "to", source = "from", qualifiedByName = {"helperMapper", "setAdditionalFields"})
    @Mapping(target = "from", ignore = true)
    Wrapper<ConnectorMng, ConnectorEx> setAdditionalFields(Wrapper<ConnectorMng, ConnectorEx> wrapper);

    @Mapping(target = "to", expression ="java(helperMapper.mapMethodsOfConnector(wrapper.getFrom(), wrapper.getTo()))")
    @Mapping(target = "from", ignore = true)
    Wrapper<ConnectorMng, ConnectorEx> mapMethodsOfConnector(Wrapper<ConnectorMng, ConnectorEx> wrapper);
}
