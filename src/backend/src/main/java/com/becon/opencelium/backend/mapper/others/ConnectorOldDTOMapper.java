package com.becon.opencelium.backend.mapper.others;

import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import com.becon.opencelium.backend.resource.connection.old.ConnectorOldDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {
                MethodOldDTOMapper.class,
                OperatorOldDTOMapper.class
        }
)
@Named("connectorOldDTOMapper")
public interface ConnectorOldDTOMapper extends Mapper<ConnectorDTO, ConnectorOldDTO> {
    @Named("toDTO")
    @Mapping(target = "methods",qualifiedByName = {"methodOldDTOMapper", "toDTOAll"})
    @Mapping(target = "operators",qualifiedByName = {"operatorOldDTOMapper", "toDTOAll"})
    ConnectorDTO toEntity(ConnectorOldDTO dto);

    @Named("toOldDTO")
    @Mapping(target = "methods",qualifiedByName = {"methodOldDTOMapper", "toOldDTOAll"})
    @Mapping(target = "operators",qualifiedByName = {"operatorOldDTOMapper", "toOldDTOAll"})
    ConnectorOldDTO toDTO(ConnectorDTO entity);
}
