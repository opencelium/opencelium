package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ReferenceMng;

public interface ReferenceMngService {
    ReferenceMng save(ReferenceMng reference);

    ReferenceMng getById(String id);
}
