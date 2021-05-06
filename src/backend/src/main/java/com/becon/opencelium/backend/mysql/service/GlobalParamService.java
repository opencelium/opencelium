package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.GlobalParam;
import com.becon.opencelium.backend.resource.application.GlobalParamResource;

import java.util.List;

public interface GlobalParamService {
    List<GlobalParam> getAllByName(String name);
    GlobalParam toEntity(GlobalParamResource globalParamResource);
    GlobalParamResource toResource(GlobalParam globalParam);
    GlobalParam findByName(String name);
    void save(GlobalParam globalParam);
}
