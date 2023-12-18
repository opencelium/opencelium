package com.becon.opencelium.backend.mapper.base;

import java.util.ArrayList;
import java.util.List;

public interface MapperUpdatable<E, D> extends Mapper<E, D>{
    void updateEntityFromDto(E entity, D dto);
}
