package com.becon.opencelium.backend.mapper.v5;

import com.becon.opencelium.backend.database.mongodb.entity.RetryOnErrorMng;
import com.becon.opencelium.backend.resource.connection.v5.RetryOnErrorDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Named;

@Named("retryMapper")
@Mapper(componentModel = "spring")
public interface RetryOnErrorMapper {

    @Named("toDTO")
    RetryOnErrorDTO toDTO(RetryOnErrorMng retry);
}