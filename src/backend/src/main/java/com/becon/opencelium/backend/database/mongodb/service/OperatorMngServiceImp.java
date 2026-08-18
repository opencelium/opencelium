package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.constant.ExceptionMessages;
import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.ocel.OCExpressionHelper;
import com.becon.opencelium.backend.ocel.Validator;
import org.apache.commons.lang3.StringUtils;
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
        validateExpression(operator);
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

    private void validateExpression(OperatorMng operator) {
        if (StringUtils.isBlank(operator.getExpression())) {
            throw new GeneralServiceException(
                    ExceptionConstant.OPERATOR_EXPRESSION_IS_EMPTY,
                    String.format(ExceptionMessages.OPERATOR_EXPRESSION_IS_EMPTY, operator.getIndex(), operator.getType())
            );
        }

        if ("if".equals(operator.getType())) {
            ocelValidator.validate(operator.getExpression());
        } else {
            OCExpressionHelper.validateLoopExp(operator.getExpression());
        }
    }
}
