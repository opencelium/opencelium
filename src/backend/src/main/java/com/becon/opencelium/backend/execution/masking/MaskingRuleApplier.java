package com.becon.opencelium.backend.execution.masking;

import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;

public interface MaskingRuleApplier {
    String apply(String message, MaskingRule rule);
}
