package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.database.mongodb.repository.OperatorMngRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OperatorMngServiceImp implements OperatorMngService{
    private final OperatorMngRepository operatorMngRepository;

    public OperatorMngServiceImp(OperatorMngRepository operatorMngRepository) {
        this.operatorMngRepository = operatorMngRepository;
    }

    @Override
    public List<OperatorMng> saveAll(List<OperatorMng> operators) {
        return operatorMngRepository.saveAll(operators);
    }

    @Override
    public OperatorMng save(OperatorMng operatorMng) {
        return operatorMngRepository.save(operatorMng);
    }

    @Override
    public void deleteById(String id) {
        operatorMngRepository.deleteById(id);
    }
}
