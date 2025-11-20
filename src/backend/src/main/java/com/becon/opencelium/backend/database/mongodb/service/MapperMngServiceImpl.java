package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.MapperMng;
import com.becon.opencelium.backend.database.mongodb.repository.MapperMngRepository;
import org.springframework.stereotype.Service;

@Service("mapperMngServiceImpl")
public class MapperMngServiceImpl implements MapperMngService {
    private final MapperMngRepository mapperMngRepository;

    public MapperMngServiceImpl(MapperMngRepository mapperMngRepository) {
        this.mapperMngRepository = mapperMngRepository;
    }

    @Override
    public MapperMng save(MapperMng reference) {
        return mapperMngRepository.save(reference);
    }

    @Override
    public MapperMng getById(String id) {
        return mapperMngRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MAPPER_NOT_FOUND"));
    }

    @Override
    public void delete(String id) {
        mapperMngRepository.deleteById(id);
    }
}
