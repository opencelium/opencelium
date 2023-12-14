package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connector.InvokerDTO;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
@Named("invokerMapper")
public interface InvokerMapper extends Mapper<Invoker, InvokerDTO> {
    @Override
    @Named("toEntity")
    default Invoker toEntity(InvokerDTO dto){
        return null;
    }

    @Override
    @Named("toDTO")
    default InvokerDTO toDTO(Invoker entity){
        return null;
    }
}
