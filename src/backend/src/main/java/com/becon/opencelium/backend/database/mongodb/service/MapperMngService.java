package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.MapperMng;

public interface MapperMngService {
    MapperMng save(MapperMng reference);

    MapperMng getById(String id);

    void delete(String id);
}
