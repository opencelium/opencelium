package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.ConditionMng;
import com.becon.opencelium.backend.database.mongodb.entity.StatementMng;
import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.resource.execution.ConditionEx;
import org.springframework.stereotype.Component;

@Component
public class ConditionExMapper {
    public ConditionEx toEntity(ConditionMng dto, String type) {
        ConditionEx condition = new ConditionEx();
        RelationalOperator ro;
        if (type.equals("loop") && (dto.getRelationalOperator() == null || dto.getRelationalOperator().isBlank())) {
            ro = RelationalOperator.FOR;
        } else {
            ro = RelationalOperator.fromName(dto.getRelationalOperator());
        }

        StatementMng ls = dto.getLeftStatement();
        StatementMng rs = dto.getRightStatement();
        switch (ro) {
            case CONTAINS, NOT_CONTAINS -> {
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField() + "." + rs.getRightPropertyValue());
                if (rs.getColor() == null || rs.getColor().isBlank() || rs.getType() == null || rs.getType().isBlank()) {
                    condition.setRight(rs.getField());
                } else {
                    condition.setRight(rs.getColor() + ".(" + rs.getType() + ")." + rs.getField());
                }
            }
            case EQUAL_TO, GREATER_THAN, GREATER_THAN_OR_EQUAL_TO, LESS_THAN, LESS_THAN_OR_EQUAL_TO, LIKE, MATCHES,
                 MATCHES_IN_LIST, NOT_LIKE, REGEX -> {
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField());
                if (rs.getColor() == null || rs.getColor().isBlank() || rs.getType() == null || rs.getType().isBlank()) {
                    condition.setRight(rs.getField());
                } else {
                    condition.setRight(rs.getColor() + ".(" + rs.getType() + ")." + rs.getField());
                }
            }
            case PROPERTY_NOT_EXISTS, PROPERTY_EXISTS, IS_TYPE_OF -> {
                //TODO: ???
            }
            case SPLIT_STRING -> {
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField());
                condition.setRight(",");
            }
            case IS_EMPTY, IS_NOT_EMPTY, IS_NOT_NULL, IS_NULL, FOR, FOR_IN, DEFAULT -> {
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField());
            }
        }

        condition.setRelationalOperator(ro);
        return condition;
    }
}
