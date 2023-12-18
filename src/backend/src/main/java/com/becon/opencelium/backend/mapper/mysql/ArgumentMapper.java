package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.Argument;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.aggregator.ArgumentDTO;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
@Named("argumentMapper")
public interface ArgumentMapper extends Mapper<Argument, ArgumentDTO> {
    @Named("toEntity")
    Argument toEntity(ArgumentDTO dto);

    @Named("toDTO")
    ArgumentDTO toDTO(Argument entity);
}
