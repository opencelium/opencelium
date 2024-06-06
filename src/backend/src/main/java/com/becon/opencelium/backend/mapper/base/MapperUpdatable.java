package com.becon.opencelium.backend.mapper.base;

public interface MapperUpdatable<E, D> extends Mapper<E, D> {
    void updateEntityFromDto(E entity, D dto);

    void updateDtoFromEntity(D dto, E entity);
}
