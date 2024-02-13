package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.ConditionMng;
import com.becon.opencelium.backend.database.mongodb.entity.StatementMng;
import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.resource.execution.ConditionEx;
import org.springframework.stereotype.Component;

@Component
public class ConditionExMapper {
    public ConditionEx toEntity(ConditionMng dto) {
        ConditionEx condition = new ConditionEx();
        RelationalOperator ro = RelationalOperator.fromName(dto.getRelationalOperator());
        StatementMng ls = dto.getLeftStatement();
        StatementMng rs = dto.getRightStatement();
        switch (ro) {
            case CONTAINS, NOT_CONTAINS: {
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField() + "." + rs.getRightPropertyValue());
                condition.setRight(rs.getColor() + ".(" + rs.getType() + ")." + rs.getField());
            }
            case EQUAL_TO, GREATER_THAN, GREATER_THAN_OR_EQUAL_TO, LESS_THAN, LESS_THAN_OR_EQUAL_TO, LIKE, MATCHES, MATCHES_IN_LIST, NOT_LIKE, REGEX: {
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField());
                condition.setRight(rs.getColor() + ".(" + rs.getType() + ")." + rs.getField());
            }
            case PROPERTY_NOT_EXISTS, PROPERTY_EXISTS, IS_TYPE_OF: {
                //TODO: ???
            }
            case IS_EMPTY, IS_NOT_EMPTY, IS_NOT_NULL, ISNULL: {
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField());
            }
            case DEFAULT: {
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField());
            }
        }
        condition.setRelationalOperator(dto.getRelationalOperator());
        return condition;
    }
}
