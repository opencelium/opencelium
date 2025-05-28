package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.log_managing.commons.LogElementType;
import com.becon.opencelium.backend.execution.log_managing.resource.MetaDataListDto;
import com.becon.opencelium.backend.mapper.base.Mapper;
import org.mapstruct.Mapping;

@org.mapstruct.Mapper(
        componentModel = "spring",
        imports = {LogElementType.class}
)
public interface LogMetaDataMapper extends Mapper<LogMetaData, MetaDataListDto> {

    @Override
    default LogMetaData toEntity(MetaDataListDto dto) {
        // It is not used
        return null;
    }

    @Override
    @Mapping(target = "executionId", source = "executionId")
    @Mapping(target = "connectorId", source = "flowchartId")
    @Mapping(target = "indexPath", source = "indexPath")
    @Mapping(target = "type", expression = "java(LogElementType.fromSecondNameOrElseNull(entity.getType()))")
    @Mapping(target = "name", expression = "java(entity.getMeta() != null ? entity.getMeta().getOrDefault(\"name\", null) : null)")
    @Mapping(target = "meta", source = "meta")
    @Mapping(target = "status", ignore = true) // TODO: ???
    // TODO: add error field to LogMetaData
    @Mapping(target = "error", ignore = true)
    MetaDataListDto toDTO(LogMetaData entity);
}
