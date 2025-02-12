package com.becon.opencelium.backend.execution.masking;

import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.enums.RuleType;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

public class MaskingServiceImp implements MaskingService {
    private final List<MaskingRule> rules;

    public MaskingServiceImp(List<MaskingRule> rules) {
        this.rules = rules;
    }

    @Override
    public String applyMask(Object message, String ref) {
        // there are 5 cases:
        // 1) ref = #colour.(request).url
        // 2) ref = #colour.(request).header
        // 3) ref = #colour.(request).body
        // 4) ref = #colour.(response).body
        // 5) ref = 'directRef' - this case if for Operators

        String result = toJsonElseString(message);

        for (MaskingRule rule : rules) {
            if (rule.getType() ==  RuleType.REGEX || contains(rule.getExpression(), ref)) {
                result = rule.getType().apply(result, rule);
            }
        }

        return getPrefix(ref) + result;
    }

    private static String toJsonElseString(Object message) {
        if (message == null) {
            return "";
        } else if (message instanceof String result) {
            return result;
        }

        try {
            return new ObjectMapper().writer().withDefaultPrettyPrinter().writeValueAsString(message);
        } catch (Exception e) {
            return message.toString();
        }
    }

    private boolean contains(String expression, String ref) {
        // rule.getExpression().startsWith(ref) || rule.getExpression().startsWith(all)
        return expression.startsWith(ref);
    }

    private String getPrefix(String ref) {
        if (ref.contains("(request).url") && ref.length() == 21) {
            return "URL: ";
        }

        if (ref.contains("(request).header") && ref.length() == 24) {
            return "Header: ";
        }

        if (ref.contains("(request).body") && ref.length() == 22) {
            return "Body: ";
        }

        if (ref.contains("(response).body") && ref.length() == 23) {
            return "Response: ";
        }

        return ref + ": ";
    }
}
