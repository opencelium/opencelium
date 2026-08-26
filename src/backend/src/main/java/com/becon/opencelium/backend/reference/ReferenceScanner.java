package com.becon.opencelium.backend.reference;

import com.becon.opencelium.backend.reference.enums.ReferenceType;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;

import static com.becon.opencelium.backend.reference.Patterns.*;

public final class ReferenceScanner {

    private ReferenceScanner() {
    }

    public static List<String> extract(String expression) {
        if (expression == null || expression.isEmpty()) {
            return List.of();
        }

        List<String> result = new ArrayList<>();
        char[] copy = expression.toCharArray();

        Matcher matcher = WITHOUT_DIRECT_REF.matcher(expression);
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

    public static List<String> extract(String expression, ReferenceType type) {
        if (expression == null || expression.isEmpty()) {
            return List.of();
        }

        List<String> result = new ArrayList<>();

        Matcher matcher = Patterns.of(type).matcher(expression);
        while (matcher.find()) {
            result.add(matcher.group());
        }

        return result;
    }
}
