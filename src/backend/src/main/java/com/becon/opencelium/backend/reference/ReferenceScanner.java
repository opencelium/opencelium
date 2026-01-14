package com.becon.opencelium.backend.reference;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.becon.opencelium.backend.constant.RegExpression.enhancement;
import static com.becon.opencelium.backend.constant.RegExpression.pageRef;
import static com.becon.opencelium.backend.constant.RegExpression.requestData;
import static com.becon.opencelium.backend.constant.RegExpression.webhook;
import static com.becon.opencelium.backend.constant.RegExpression.wrappedDirectRef;

public final class ReferenceScanner {
    private static final Pattern EXTRACTION_PATTERN =
            Pattern.compile(
                    wrappedDirectRef + "|" +
                            enhancement + "|" +
                            webhook + "|" +
                            pageRef + "|" +
                            requestData
            );

    private ReferenceScanner() {
    }

    public static List<String> extract(String expression) {
        if (expression == null || expression.isEmpty()) {
            return List.of();
        }

        List<String> result = new ArrayList<>();
        Matcher matcher = EXTRACTION_PATTERN.matcher(expression);

        while (matcher.find()) {
            result.add(matcher.group());
        }

        return result;
    }
}
