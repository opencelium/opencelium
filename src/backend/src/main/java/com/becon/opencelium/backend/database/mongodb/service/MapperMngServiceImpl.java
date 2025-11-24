package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.database.mongodb.entity.MapperMng;
import com.becon.opencelium.backend.database.mongodb.repository.MapperMngRepository;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.utility.ReferenceUtility;
import org.springframework.stereotype.Service;

import java.util.Map;

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

    @Override
    public void validate(MapperMng mapper) {
        validateArgs(mapper.getArgs());
    }

    private void validateArgs(Map<String, String> args) {
        if (args.containsKey("RESULT_VAR")) {
            throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, "MISSING_RESULT_VAR");
        }

        for (Map.Entry<String, String> entry : args.entrySet()) {
            if (!ReferenceUtility.isDirectReference(entry.getValue())) {
                throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, "INVALID_REFERENCE");
            }
        }
    }
}
