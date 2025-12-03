package com.becon.opencelium.backend.mapper.v5;

import com.becon.opencelium.backend.database.mongodb.entity.EnhancementMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.entity.MapperMng;
import com.becon.opencelium.backend.resource.connection.old.EnhancementOldDTO;
import com.becon.opencelium.backend.resource.connection.old.FieldBindingOldDTO;
import com.becon.opencelium.backend.resource.v5.connection.MapperDTO;
import com.becon.opencelium.backend.utility.ReferenceUtility;
import org.mapstruct.Mapper;
import org.mapstruct.Named;

import java.util.List;

@Named("mapperMapper")
@Mapper(componentModel = "spring")
public abstract class MapperMapper {

    @Named("toDTO")
    public abstract MapperDTO toDTO(MapperMng mapper);

    @Named("toDTOAll")
    public List<MapperDTO> toDTOAll(List<MapperMng> mapper){
        if (mapper == null) {
            return null;
        }

        return mapper.stream().map(this::toDTO).toList();
    }

    public MapperDTO fromFb(FieldBindingOldDTO fb){
        if (fb == null) return null;

        EnhancementOldDTO enhancement = fb.getEnhancement();

        MapperDTO dto = new MapperDTO();
        dto.setId(fb.getNodeId());

        if (enhancement != null) {
            dto.setDescription(enhancement.getDescription());
            dto.setLanguage(enhancement.getLanguage());
            dto.setTitle(enhancement.getName());
            dto.setScript(enhancement.getExpertCode());
            dto.setArgs(ReferenceUtility.convertEnhancementArgs(enhancement.getExpertVar()));
        }

        return dto;
    }

    public MapperMng fromFb(FieldBindingMng fb){
        if (fb == null) return null;

        EnhancementMng enhancement = fb.getEnhancement();

        MapperMng mapper = new MapperMng();
        mapper.setId(fb.getId());

        if (enhancement != null) {
            mapper.setDescription(enhancement.getDescription());
            mapper.setLanguage(enhancement.getLanguage());
            mapper.setTitle(enhancement.getTitle());
            mapper.setScript(enhancement.getScript());
            mapper.setArgs(ReferenceUtility.convertEnhancementArgs(enhancement.getArgs()));
        }

        return mapper;
    }
}
