package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.EditorSettings;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.EditorSettingsDTO;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
public interface EditorSettingsMapper extends Mapper<EditorSettings, EditorSettingsDTO> {
    @Override
    default EditorSettings toEntity(EditorSettingsDTO dto) {
        return null;
    }

    @Override
    @Mapping(target = "userId", source = "user.id")
    EditorSettingsDTO toDTO(EditorSettings entity);
}
