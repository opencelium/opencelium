package com.becon.opencelium.backend.mapper.others;

import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.ConnectionOldDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = FieldBindingOldDTOMapper.class
)
@Named("connectionOldDTOMapper")
public interface ConnectionOldDTOMapper extends Mapper<ConnectionDTO, ConnectionOldDTO> {
    @Named("toDTO")
    @Mapping(target = "fieldBinding", source = "fieldBinding",qualifiedByName = {"fieldBindingOldDTOMapper", "toDTOAll"})
    ConnectionDTO toEntity(ConnectionOldDTO dto);

    @Named("toOldDTO")
    @Mapping(target = "fieldBinding", source = "fieldBinding",qualifiedByName = {"fieldBindingOldDTOMapper", "toOldDTOAll"})
    ConnectionOldDTO toDTO(ConnectionDTO entity);
}
