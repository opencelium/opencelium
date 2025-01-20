package com.becon.opencelium.backend.resource.connection.masking;

import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.enums.RuleType;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.annotation.Resource;

@Resource
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RuleDTO {
    private Long ruleId;
    private RuleType type;
    private String expression;

    public static RuleDTO fromEntity(MaskingRule rule) {
        RuleDTO dto = new RuleDTO();
        dto.setRuleId(rule.getId());
        dto.setType(rule.getType());
        dto.setExpression(rule.getExpression());

        return dto;
    }

    public Long getRuleId() {
        return ruleId;
    }

    public void setRuleId(Long ruleId) {
        this.ruleId = ruleId;
    }

    public RuleType getType() {
        return type;
    }

    public void setType(RuleType type) {
        this.type = type;
    }

    public String getExpression() {
        return expression;
    }

    public void setExpression(String expression) {
        this.expression = expression;
    }
}
