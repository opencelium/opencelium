package com.becon.opencelium.backend.mapper.v5;

import com.becon.opencelium.backend.database.mongodb.entity.OnErrorMng;
import com.becon.opencelium.backend.resource.v5.connection.OnErrorDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Named("onErrorMapper")
@Mapper(componentModel = "spring", uses = {RetryOnErrorMapper.class})
public interface OnErrorMapper {

    @Named("toDTO")
    @Mapping(target = "retry", source = "retry", qualifiedByName = {"retryMapper", "toDTO"})
    OnErrorDTO toDTO(OnErrorMng  onError);
}
