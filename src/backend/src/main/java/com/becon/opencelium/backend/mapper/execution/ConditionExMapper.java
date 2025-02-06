package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.ConditionMng;
import com.becon.opencelium.backend.database.mongodb.entity.StatementMng;
import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.resource.execution.ConditionEx;
import io.micrometer.common.util.StringUtils;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class ConditionExMapper {

    // this mapper is only 'loop' operators
    public ConditionEx toEntity(ConditionMng dto, String type) {
        if (Objects.isNull(dto)) {
            return null;
        }
        ConditionEx condition = new ConditionEx();

        RelationalOperator ro = identifyRelationalOperator(dto.getRelationalOperator(), type);
        condition.setRelationalOperator(ro);

        if (Objects.nonNull(dto.getLeftStatement())) {
            condition.setLeft(areColorAndOrTypeNullOrEmpty(dto.getLeftStatement())
                    ? dto.getLeftStatement().getField()
                    : flatten(dto.getLeftStatement()));
        }
        if(Objects.nonNull(dto.getRightStatement())) {
            condition.setRight(areColorAndOrTypeNullOrEmpty(dto.getRightStatement())
                    ? dto.getRightStatement().getField()
                    : flatten(dto.getRightStatement()));
        }
        return condition;
    }

    private String flatten(StatementMng st) {
        return st.getColor() + // color
                ".(" + st.getType() + ")" + // type
                (st.getField() == null ? "" : "." + st.getField()) + // field
                (StringUtils.isBlank(st.getRightPropertyValue()) ? "" : "." + st.getRightPropertyValue()); // rpv
    }

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

    private boolean areColorAndOrTypeNullOrEmpty(StatementMng st) {
        return StringUtils.isBlank(st.getColor()) || StringUtils.isBlank(st.getType());
    }
}