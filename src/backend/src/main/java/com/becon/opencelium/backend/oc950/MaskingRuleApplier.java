package com.becon.opencelium.backend.oc950;

import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;

public interface MaskingRuleApplier {
    String apply(String message, MaskingRule rule);
}
