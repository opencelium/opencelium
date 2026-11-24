package com.becon.opencelium.backend.reference;

import com.becon.opencelium.backend.constant.RegExpression;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The escape of a global variable token: {@code \{{global.name}}} is literal text. It is never
 * resolved, and it leaves the backend as {@code {{global.name}}}, without the backslash.
 *
 * <p>Whoever looks for references hides escaped tokens first with {@link #mask(String)}, so no
 * reference is found inside them; whoever produces the final text calls {@link
 * #unescape(String)}.
 */
public final class GlobalEscape {

    private static final Pattern ESCAPED = Pattern.compile(RegExpression.escapedGlobalRef);

    // every escaped token starts with it, so most texts are told apart without a regex
    private static final String START = "\\{{global.";

    private GlobalEscape() {
    }

    /** Tells whether {@code text} holds an escaped token. */
    public static boolean isPresent(String text) {
        return text != null && text.contains(START) && ESCAPED.matcher(text).find();
    }

    /**
     * Returns {@code text} with every escaped token replaced by blanks. The result has the length
     * of the text, so a position found in it is a position in the text.
     */
    public static String mask(String text) {
        if (text == null || !text.contains(START)) {
            return text;
        }

        Matcher matcher = ESCAPED.matcher(text);
        if (!matcher.find()) {
            return text;
        }

        char[] masked = text.toCharArray();
        do {
            Arrays.fill(masked, matcher.start(), matcher.end(), ' ');
        } while (matcher.find());

        return new String(masked);
    }

    /** Returns {@code text} with the backslash of every escaped token removed. */
    public static String unescape(String text) {
        if (text == null || !text.contains(START)) {
            return text;
        }

        Matcher matcher = ESCAPED.matcher(text);
        StringBuilder result = new StringBuilder(text.length());
        int cursor = 0;
        while (matcher.find()) {
            result.append(text, cursor, matcher.start());
            result.append(text, matcher.start() + 1, matcher.end());
            cursor = matcher.end();
        }

        return result.append(text, cursor, text.length()).toString();
    }

    /** Returns the escaped tokens of {@code text}, each once, in the order they first appear. */
    public static List<String> tokensIn(String text) {
        List<String> tokens = new ArrayList<>();
        if (text == null || !text.contains(START)) {
            return tokens;
        }

        Matcher matcher = ESCAPED.matcher(text);
        while (matcher.find()) {
            if (!tokens.contains(matcher.group())) {
                tokens.add(matcher.group());
            }
        }

        return tokens;
    }
}
