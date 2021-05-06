package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.GlobalParam;
import com.becon.opencelium.backend.mysql.repository.GlobalParamRepository;
import com.becon.opencelium.backend.resource.application.GlobalParamResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GlobalParamServiceImp implements GlobalParamService {

    @Autowired
    private GlobalParamRepository globalParamRepository;

    @Override
    public List<GlobalParam> getAllByName(String name) {
        return globalParamRepository.findAllByName(name);
    }

    @Override
    public GlobalParam findByName(String name) {
        return globalParamRepository.findByName(name).orElseThrow(() -> new RuntimeException("Global param name not found"));
    }

    @Override
    public void save(GlobalParam globalParam) {
        globalParamRepository.save(globalParam);
    }

    @Override
    public GlobalParam toEntity(GlobalParamResource globalParamResource) {
        return null;
    }

    @Override
    public GlobalParamResource toResource(GlobalParam globalParam) {
        return null;
    }
}
