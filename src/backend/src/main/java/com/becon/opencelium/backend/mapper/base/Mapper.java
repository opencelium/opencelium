package com.becon.opencelium.backend.mapper.base;

import org.mapstruct.Named;

import java.util.ArrayList;
import java.util.List;

public interface Mapper<E, D> {
    E toEntity(D dto);

    D toDTO(E entity);

    default List<E> toEntityAll(List<D> dtos) {
        if (dtos == null) {
            return null;
        }
        List<E> entities = new ArrayList<>(dtos.size());
        for (D dto : dtos) {
            entities.add(toEntity(dto));
        }
        return entities;
    }
    default List<D> toDTOAll(List<E> entities) {
        if (entities == null) {
            return null;
        }
        List<D> dtos = new ArrayList<>(entities.size());
        for (E entity : entities) {
            dtos.add(toDTO(entity));
        }
        return dtos;
    }
}
