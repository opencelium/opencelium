package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.mapper.base.Mapper;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@org.mapstruct.Mapper(
        componentModel = "spring"
)
@Named("requestDataMapper")
public interface RequestDataMapper extends Mapper<List<RequestData>, Map<String,String>> {

    @Named("toEntity")
    default List<RequestData> toEntity(Map<String, String> dto) {
        if(dto==null) return null;
        return dto.entrySet().stream()
                .map(k -> new RequestData(k.getKey(), k.getValue()))
                .collect(Collectors.toList());
    }

    @Named("toDTO")
    default Map<String, String> toDTO(List<RequestData> entity) {
        if(entity==null) return null;
        return entity.stream().filter(field -> field.getVisibility().equals("public"))
                .collect(Collectors.toMap(RequestData::getField, RequestData::getValue));
    }
}
