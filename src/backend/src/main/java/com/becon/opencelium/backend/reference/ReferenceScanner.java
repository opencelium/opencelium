package com.becon.opencelium.backend.reference;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.becon.opencelium.backend.constant.RegExpression.enhancement;
import static com.becon.opencelium.backend.constant.RegExpression.globalRef;
import static com.becon.opencelium.backend.constant.RegExpression.pageRef;
import static com.becon.opencelium.backend.constant.RegExpression.requestData;
import static com.becon.opencelium.backend.constant.RegExpression.webhook;
import static com.becon.opencelium.backend.constant.RegExpression.wrappedDirectRef;

public final class ReferenceScanner {
    // globalRef stands before requestData, so '{{global.x}}' is extracted as one reference
    private static final Pattern EXTRACTION_PATTERN =
            Pattern.compile(
                    enhancement + "|" +
                            webhook + "|" +
                            pageRef + "|" +
                            globalRef + "|" +
                            requestData
            );

    private static final Pattern WRAPPED_DIRECT_REF = Pattern.compile(wrappedDirectRef);

    private ReferenceScanner() {
    }

    public static List<String> extract(String expression) {
        if (expression == null || expression.isEmpty()) {
            return List.of();
        }

        List<String> result = new ArrayList<>();
        // an escaped global token is literal text: no reference is looked for inside it
        String scanned = GlobalEscape.mask(expression);
        char[] copy = scanned.toCharArray();

        Matcher matcher = EXTRACTION_PATTERN.matcher(scanned);
        while (matcher.find()) {
            result.add(matcher.group());

            for (int i = matcher.start(); i < matcher.end(); i++) {
                copy[i] = ' ';
            }
        }

        matcher = WRAPPED_DIRECT_REF.matcher(new String(copy));

        while (matcher.find()) {
            result.add(matcher.group());
        }

        return result;
    }
}
