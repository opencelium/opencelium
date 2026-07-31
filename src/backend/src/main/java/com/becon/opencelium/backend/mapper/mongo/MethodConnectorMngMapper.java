package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.MethodConnectorMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.MethodConnectorDTO;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        unmappedTargetPolicy = ReportingPolicy.IGNORE
)
@Named("methodConnectorMngMapper")
public interface MethodConnectorMngMapper extends Mapper<MethodConnectorMng, MethodConnectorDTO> {

    @Named("toEntity")
    MethodConnectorMng toEntity(MethodConnectorDTO dto);

    @Named("toDTO")
    MethodConnectorDTO toDTO(MethodConnectorMng entity);
}
