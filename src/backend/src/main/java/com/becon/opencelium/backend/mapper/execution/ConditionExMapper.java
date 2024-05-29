package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.ConditionMng;
import com.becon.opencelium.backend.database.mongodb.entity.StatementMng;
import com.becon.opencelium.backend.enums.DataTypeEnum;
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
            case LIKE, NOT_LIKE -> {
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField());
                if (rs.getColor() == null || rs.getColor().isBlank() || rs.getType() == null || rs.getType().isBlank()) {
                    condition.setRight(rs.getField());
                } else {
                    if (!rs.getField().contains("%")) {
                        condition.setRight(rs.getColor() + ".(" + rs.getType() + ")." + rs.getField());
                        return condition;
                    }
                    boolean first, last;
                    if (rs.getType().equals("response")) {
                        first = rs.getField().startsWith("success.%") || rs.getField().startsWith("fail.%");
                    } else {
                        first = rs.getField().startsWith("%");
                    }
                    last = rs.getField().endsWith("%");

                    rs.setField(rs.getField().replaceAll("%", ""));

                    condition.setRight((first ? "%" : "") + rs.getColor() + ".(" + rs.getType() + ")." + rs.getField() + (last ? "%" : ""));
                }
            }
            case NOT_EQUAL_TO -> {
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField());
                condition.setRight("");
            }
            case EQUAL_TO, GREATER_THAN, GREATER_THAN_OR_EQUAL_TO, LESS_THAN, LESS_THAN_OR_EQUAL_TO,
                 MATCHES, MATCHES_IN_LIST, REGEX, PROPERTY_NOT_EXISTS, PROPERTY_EXISTS -> {
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField());
                if (rs.getColor() == null || rs.getColor().isBlank() || rs.getType() == null || rs.getType().isBlank()) {
                    condition.setRight(rs.getField());
                } else {
                    condition.setRight(rs.getColor() + ".(" + rs.getType() + ")." + rs.getField());
                }
            }
            case IS_TYPE_OF -> {
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField());
                try {
                    condition.setRight(DataTypeEnum.getEnumType(rs.getField()).name());
                } catch (Exception ignored) {
                }
            }
            case SPLIT_STRING -> {
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField());
                condition.setRight(",");
            }
            case IS_EMPTY, IS_NOT_EMPTY, IS_NOT_NULL, IS_NULL, FOR, FOR_IN, DEFAULT -> {
                condition.setLeft(ls.getColor() + ".(" + ls.getType() + ")." + ls.getField());
            }
            case CONTAINS_SUB_STR, NOT_CONTAINS_SUB_STR -> {
                //TODO: ???
            }
        }

        condition.setRelationalOperator(ro);
        return condition;
    }
}
