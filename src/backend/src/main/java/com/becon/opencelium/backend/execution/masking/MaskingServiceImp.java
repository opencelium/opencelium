package com.becon.opencelium.backend.execution.masking;

import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.enums.RuleType;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URL;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
            if (rule.getType() ==  RuleType.REGEX) {
                result = rule.getType().apply(result, rule);
            } else if (contains(rule.getExpression(), ref)) {
                String expression = rule.getExpression();

                // check if we have a full path:
                if (
                    expression.equals("#[*].(request).url") ||
                    expression.equals("#[*].(request).header") ||
                    expression.equals("#[*].(request).body") ||
                    expression.equals("#[*].(response).body") ||
                    (expression.endsWith("].(request).url") && expression.length() == 21) ||
                    (expression.endsWith("].(request).header") && expression.length() == 24) ||
                    (expression.endsWith("].(request).body") && expression.length() == 22) ||
                    (expression.endsWith("].(response).body") && expression.length() == 23)
                )
                {
                    result = rule.getMask();
                    break;
                }

                result = rule.getType().apply(result, rule);
            }
        }

        return result;
    }

    private static String toJsonElseString(Object message) {
        if (message == null) {
            return "";
        } else if (message instanceof String result) {
            return result;
        } else if (message instanceof URL) {
            return message.toString();
        }

        try {
            return new ObjectMapper().writer().withDefaultPrettyPrinter().writeValueAsString(message);
        } catch (Exception e) {
            return message.toString();
        }
    }

    private boolean contains(String expression, String incoming) {
        // rule.getExpression().startsWith(ref) || rule.getExpression().startsWith(all)
        if (expression.startsWith(incoming)) {
            return true;
        }

        String regex = "^#\\[\\*\\]\\.(\\(response\\)|\\(request\\))\\.(url|header|body)";

        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(expression);

        if (matcher.find()) {
            return expression.startsWith("#[*]" + incoming.substring(7));
        }

        return false;
    }
}
