package com.becon.opencelium.backend.mapper.connection;

import com.becon.opencelium.backend.database.mongodb.entity.InvokerMng;
import com.becon.opencelium.backend.resource.connector.InvokerDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
@Named("invokerMapper")
public interface InvokerMapper {
    @Named("toEntity")
    InvokerMng toEntity(InvokerDTO invokerDTO);
    @Named("toDTO")
    InvokerDTO toDTO(InvokerMng invokerMng);
}
