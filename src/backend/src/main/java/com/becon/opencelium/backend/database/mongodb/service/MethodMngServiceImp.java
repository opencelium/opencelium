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

    @Override
    public MethodMng save(MethodMng methodMng) {
        return methodMngRepository.save(methodMng);
    }

    @Override
    public void deleteById(String id) {
        methodMngRepository.delete(methodMngRepository.findById(id).orElse(new MethodMng()));
    }

    @Override
    public void deleteAll(List<MethodMng> methods) {
        methodMngRepository.deleteAllById(methods.stream().map(MethodMng::getId).toList());
    }

    @Override
    public String getNameByCode(String methodKey) {
        MethodMng methodMng = methodMngRepository.findByColor(methodKey)
                .orElseThrow(() -> new RuntimeException("METHOD_NOT_FOUND"));
        return methodMng.getName();
    }
}
