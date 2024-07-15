package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.database.mongodb.entity.ConditionMng;
import com.becon.opencelium.backend.database.mongodb.entity.StatementMng;
import com.becon.opencelium.backend.enums.DataTypeEnum;
import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.enums.execution.DataType;
import com.becon.opencelium.backend.resource.execution.ConditionEx;
import org.springframework.stereotype.Component;

@Component
public class ConditionExMapper {
    public ConditionEx toEntity(ConditionMng dto, String type) {
        ConditionEx condition = new ConditionEx();

        RelationalOperator ro = identifyRelationalOperator(dto.getRelationalOperator(), type);
        condition.setRelationalOperator(ro);

        condition.setLeft(composeLeft(dto.getLeftStatement(), dto.getRightStatement(), ro));
        condition.setRight(composeRight(dto.getRightStatement(), ro));

        return condition;
    }

    /**
     * This method is exception-free.
     * @param type is only needed to check exceptional case. In the future, it can be fixed from frontend so that it will no longer be needed
     * @return if ro is invalid then it returns DEFAULT, otherwise returns a RelationalOperator object corresponding to ro
     */
    private RelationalOperator identifyRelationalOperator(String ro, String type) {
        RelationalOperator res;
        if (type.equals("loop") && (ro == null || ro.isBlank())) {
            // this is an exceptional case
            // When ro is null or empty, actual ro is supposed to be 'for' iff type = loop
            res = RelationalOperator.FOR;
        } else {
            res = RelationalOperator.fromName(ro);
        }
        return res;
    }

    private String composeLeft(StatementMng ls, StatementMng rs, RelationalOperator ro) {
        if (ls == null) {
            throw new RuntimeException("leftStatement can't be null");
        }

        boolean webHook = isWebHookParam(ls);
        boolean containsRelated = ro == RelationalOperator.CONTAINS
                || ro == RelationalOperator.NOT_CONTAINS
                || ro == RelationalOperator.CONTAINS_SUB_STR
                || ro == RelationalOperator.NOT_CONTAINS_SUB_STR;

        if (webHook && !containsRelated) {
            return ls.getField();
        }
        if (containsRelated && !webHook) {
            return stringify(ls) + "." + rs.getRightPropertyValue();
        }
        if (webHook) {
            return stringify(ls.getField(), rs.getRightPropertyValue());
        }

        if (areColorAndOrTypeNullOrEmpty(ls)) {
            throw new RuntimeException("Invalid leftStatement[color: %s, type: %s, field: %s]".formatted(ls.getColor(), ls.getType(), ls.getField()));
        }

        return stringify(ls);
    }

    private String composeRight(StatementMng rs, RelationalOperator ro) {
        if (rs != null && isWebHookParam(rs)) {
            return rs.getField();
        }

        if (ro == RelationalOperator.IS_EMPTY
                || ro == RelationalOperator.IS_NOT_EMPTY
                || ro == RelationalOperator.IS_NOT_NULL
                || ro == RelationalOperator.IS_NULL
                || ro == RelationalOperator.FOR
                || ro == RelationalOperator.FOR_IN
                || ro == RelationalOperator.DEFAULT) {
            return null;
        }

        if (ro == RelationalOperator.IS_TYPE_OF) {
            try {
                return DataTypeEnum.getEnumType(rs.getField()).name();
            } catch (Exception ignored) {
            }
        }

        if (rs == null &&
                !(ro == RelationalOperator.CONTAINS
                        || ro == RelationalOperator.NOT_CONTAINS
                        || ro == RelationalOperator.LIKE
                        || ro == RelationalOperator.NOT_LIKE
                        || ro == RelationalOperator.CONTAINS_SUB_STR
                        || ro == RelationalOperator.NOT_CONTAINS_SUB_STR)) {
            return "";
        } else if (rs == null) {
            throw new RuntimeException("rightStatement can't be null for " + ro.name() + " relational operator");
        }

        if (areColorAndOrTypeNullOrEmpty(rs)) {
            return rs.getField();
        }

        if (ro == RelationalOperator.LIKE || ro == RelationalOperator.NOT_LIKE) {
            return composeForLikeAndNotLikeOperators(rs);
        }

        return stringify(rs);
    }

    private String composeForLikeAndNotLikeOperators(StatementMng rs) {
        if (!rs.getField().contains("%")) {
            return stringify(rs);
        }
        boolean first, last;
        if (rs.getType().equals("response")) {
            first = rs.getField().startsWith("success.%") || rs.getField().startsWith("fail.%");
        } else {
            first = rs.getField().startsWith("%");
        }
        last = rs.getField().endsWith("%");

        rs.setField(rs.getField().replaceAll("%", ""));

        return (first ? "%" : "") + rs.getColor() + ".(" + rs.getType() + ")." + rs.getField() + (last ? "%" : "");
    }

    private String stringify(StatementMng st) {
        return st.getColor() + ".(" + st.getType() + ")." + st.getField();
    }

    private String stringify(String field, String rpv) {
        if (field.matches(RegExpression.webhook)) {
            int index = field.indexOf(':');
            int array = field.indexOf(DataType.ARRAY.getType());
            if (index == -1) {
                return field.substring(0, field.length() - 1) + "." + rpv + "}";
            }
            if (array == -1 || array < index) {
                return field.substring(0, index) + "." + rpv + field.substring(index);
            }
            return field.substring(0, index) + "[*]." + rpv + ":" + DataType.ARRAY.getType() + "}";
        }
        return field + "." + rpv;
    }

    private boolean areColorAndOrTypeNullOrEmpty(StatementMng st) {
        return st.getColor() == null || st.getColor().isBlank() || st.getType() == null || st.getType().isBlank();
    }

    private boolean isWebHookParam(StatementMng st) {
        return st.getField() != null
                && areColorAndOrTypeNullOrEmpty(st)
                && (st.getField().matches(RegExpression.webhook)
                || st.getField().matches(RegExpression.requestData));
    }
}