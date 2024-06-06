package com.becon.opencelium.backend.mapper.mysql.invoker;

import com.becon.opencelium.backend.invoker.entity.RequiredData;
import com.becon.opencelium.backend.mapper.base.Mapper;
import org.mapstruct.Named;

import java.util.*;
import java.util.stream.Collectors;

@org.mapstruct.Mapper(
        componentModel = "spring"
)
@Named("requiredDataMapper")
public interface RequiredDataMapper extends Mapper<List<RequiredData>, Map<String, String>> {

    @Named("toEntity")
    default List<RequiredData> toEntity(Map<String, String> dto) {
        return new ArrayList<>();
    }

    @Named("toDTO")
    default LinkedHashMap<String, String> toDTO(List<RequiredData> entity) {
        if (entity == null) return new LinkedHashMap<>();
        return entity.stream().filter(d -> !d.getVisibility().equals("private"))
                .collect(Collectors.toMap(RequiredData::getName, RequiredData::getValue,
                        (existingValue, newValue) -> existingValue, LinkedHashMap::new));
    }
}
