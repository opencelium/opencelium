package com.becon.opencelium.backend.execution.masking;

import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RegexMaskingRule implements MaskingRuleApplier {
    @Override
    public String apply(String text, MaskingRule rule) {
        Pattern pattern = Pattern.compile(rule.getExpression());
        Matcher matcher = pattern.matcher(text);

        return matcher.replaceAll(rule.getMask());
    }
}
