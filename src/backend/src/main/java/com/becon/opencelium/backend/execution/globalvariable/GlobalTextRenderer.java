package com.becon.opencelium.backend.execution.globalvariable;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.reference.model.GlobalReference;

import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Renders a text that holds global variable references and nothing else to resolve: the value
 * of a connector field or the template of a notification.
 *
 * <p>Every reference is replaced in one pass over the text as it is written, so a value that is
 * put in is never searched for further references. An escaped token, {@code \{{global.name}}},
 * is literal text and only loses its backslash.
 */
public final class GlobalTextRenderer {

    // an escaped token first, so its braces are never taken for a reference
    private static final Pattern TOKEN =
            Pattern.compile("(" + RegExpression.escapedGlobalRef + ")|" + RegExpression.globalRef);

    private static final String START = "{{global.";

    private GlobalTextRenderer() {
    }

    /** Tells whether {@code text} holds anything this renderer changes. */
    public static boolean hasTokens(String text) {
        return text != null && text.contains(START);
    }

    /**
     * Returns {@code text} with every global variable reference replaced by what {@code valueOf}
     * returns for it.
     *
     * @param valueOf the text to put in the place of a reference; what it throws ends the
     *                rendering
     */
    public static String render(String text, Function<GlobalReference, String> valueOf) {
        if (!hasTokens(text)) {
            return text;
        }

        Matcher matcher = TOKEN.matcher(text);
        StringBuilder result = new StringBuilder(text.length());
        int cursor = 0;
        while (matcher.find()) {
            result.append(text, cursor, matcher.start());

            if (matcher.group(1) != null) {
                // escaped: the token without its backslash
                result.append(text, matcher.start() + 1, matcher.end());
            } else {
                result.append(valueOf.apply(GlobalReference.parse(matcher.group())));
            }

            cursor = matcher.end();
        }

        return result.append(text, cursor, text.length()).toString();
    }
}
