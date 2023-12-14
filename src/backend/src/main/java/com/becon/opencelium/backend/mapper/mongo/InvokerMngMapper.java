package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.InvokerMng;
import com.becon.opencelium.backend.resource.connector.InvokerDTO;
import com.becon.opencelium.backend.mapper.base.Mapper;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
@Named("invokerMngMapper")
public interface InvokerMngMapper extends Mapper<InvokerMng, InvokerDTO>{
    @Named("toEntity")
    InvokerMng toEntity(InvokerDTO invokerDTO);

    @Named("toDTO")
    InvokerDTO toDTO(InvokerMng invokerMng);
}
