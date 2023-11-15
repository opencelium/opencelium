package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.repository.MethodMngRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MethodMngServiceImp implements MethodMngService {
    private final MethodMngRepository methodMngRepository;

    public MethodMngServiceImp(MethodMngRepository methodMngRepository) {
        this.methodMngRepository = methodMngRepository;
    }

    @Override
    public List<MethodMng> saveAll(List<MethodMng> methods) {
        return methodMngRepository.saveAll(methods);
    }
}
