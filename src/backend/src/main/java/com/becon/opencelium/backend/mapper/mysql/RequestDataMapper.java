package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.mapper.base.Mapper;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.List;
import java.util.Map;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
@Named("requestDataMapper")
public interface RequestDataMapper extends Mapper<List<RequestData>, Map<String,String>> {
    @Override
    default List<RequestData> toEntity(Map<String, String> dto) {
        return null;
    }

    @Override
    default Map<String, String> toDTO(List<RequestData> entity) {
        return null;
    }
}
