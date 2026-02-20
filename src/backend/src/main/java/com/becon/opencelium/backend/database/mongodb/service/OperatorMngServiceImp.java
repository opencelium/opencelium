package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.ocel.OCExpressionHelper;
import com.becon.opencelium.backend.ocel.Validator;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OperatorMngServiceImp implements OperatorMngService {
    private final Validator ocelValidator;
    private final MongoTemplate mongoTemplate;

    public OperatorMngServiceImp(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
        this.ocelValidator = Validator.defaultValidator();
    }

    @Override
    public void validate(OperatorMng operator) {
        validateExpression(operator.getExpression(), operator.getType());
    }

    @Override
    public void validate(List<OperatorMng> operators) {
        if (operators != null) {
            operators.forEach(this::validate);
        }
    }

    @Override
    public void deleteAll() {
        mongoTemplate.dropCollection("operator");
    }

    private void validateExpression(String exp, String type) {
        if ("if".equals(type)) {
            ocelValidator.validate(exp);
        } else {
            OCExpressionHelper.validateLoopExp(exp);
        }
    }
}
