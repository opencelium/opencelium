package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class OperatorExMapper {
    private final ConditionExMapper conditionExMapper;

    public OperatorExMapper(ConditionExMapper conditionExMapper) {
        this.conditionExMapper = conditionExMapper;
    }

    public OperatorEx toEntity(OperatorMng dto){
        OperatorEx operatorEx = new OperatorEx();
        operatorEx.setId(dto.getId());
        operatorEx.setIndex(dto.getIndex());
        operatorEx.setType(dto.getType());
        operatorEx.setIterator(dto.getIterator());
        operatorEx.setCondition(conditionExMapper.toEntity(dto.getCondition()));
        return operatorEx;
    }
    public List<OperatorEx> toEntityAll(List<OperatorMng> dtoList){
        if(dtoList==null || dtoList.isEmpty()){
            return null;
        }
        List<OperatorEx> operatorExes = new ArrayList<>();
        for (OperatorMng operatorMng : dtoList) {
            operatorExes.add(toEntity(operatorMng));
        }
        return operatorExes;
    }
}
