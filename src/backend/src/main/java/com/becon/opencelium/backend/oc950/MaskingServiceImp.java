package com.becon.opencelium.backend.oc950;

import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.enums.MaskPart;
import com.becon.opencelium.backend.enums.RuleType;

import java.util.List;

public class MaskingServiceImp implements MaskingService {
    private final List<MaskingRule> rules;
    private String operationId;

    public MaskingServiceImp(List<MaskingRule> rules) {
        this.rules = rules;
    }

    @Override
    public String applyMask(Object message, MaskPart part) {
        String prefix = part.toRef(operationId);

        String result = part.toString(message);

        for (MaskingRule rule : rules) {
            if (rule.getType() ==  RuleType.REGEX || rule.getExpression().startsWith(prefix) || rule.getExpression().startsWith("#[*].")) {
                result = rule.getType().apply(result, rule);
            }
        }

        return result;
    }

    @Override
    public void setOperationId(String operationId) {
        this.operationId = operationId;
    }
}
