package com.becon.opencelium.backend.reference;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

    // ref("...") or ref('...') as a call of its own, not obj.ref(...) or myref(...); the
    // argument runs up to the next quote of the same kind
    private static final Pattern SCRIPT_REF =
            Pattern.compile("(?<![\\w$.])ref\\s*\\(\\s*([\"'])((?:(?!\\1).)*)\\1\\s*\\)");

    // set("...", value) as a call of its own: the quoted first argument is the target
    private static final Pattern SCRIPT_SET =
            Pattern.compile("(?<![\\w$.])set\\s*\\(\\s*([\"'])((?:(?!\\1).)*)\\1");

    // any call of set(...), whatever its first argument
    private static final Pattern SCRIPT_SET_CALL = Pattern.compile("(?<![\\w$.])set\\s*\\(");

    // name of the variable a ref(...) call is bound to; upper case like the VAR_n of enhancement
    // args, which every script engine already binds
    private static final String SCRIPT_REF_VARIABLE = "OC_REF_";

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

    /**
     * A {@code ref("...")} call, or the target of a {@code set("...", value)} call, in the code
     * of a script.
     *
     * @param start     where it starts in the code: the {@code r} of {@code ref}, or the opening
     *                  quote of the target of {@code set}
     * @param end       index just past the closing parenthesis of {@code ref}, or just past the
     *                  closing quote of the target of {@code set}
     * @param reference the quoted argument, e.g. {@code {{global.tenants[0].id}}}
     */
    public record ScriptRef(int start, int end, String reference) {
    }

    /**
     * A script whose {@code ref("...")} calls stand replaced by variables, and the args that
     * bind those variables to the references.
     *
     * @param code the code to run
     * @param args the args of the script plus one {@code OC_REF_n -> reference} per distinct
     *             reference, resolved like every other arg before the script runs
     */
    public record BoundScript(String code, Map<String, String> args) {
    }

    /**
     * Finds the {@code ref("...")} calls of a script whose argument holds a reference, in the
     * order they appear. A call with any other argument is no reference and is left out.
     */
    public static List<ScriptRef> findScriptRefs(String code) {
        if (code == null || code.indexOf("ref") == -1) {
            return List.of();
        }

        List<ScriptRef> found = new ArrayList<>();
        Matcher matcher = SCRIPT_REF.matcher(code);
        while (matcher.find()) {
            String reference = matcher.group(2).strip();
            if (ReferenceDetector.containsReference(reference)) {
                found.add(new ScriptRef(matcher.start(), matcher.end(), reference));
            }
        }

        return found;
    }

    /**
     * Replaces each {@code ref("...")} call of a script with a variable and binds the variable to
     * the call's reference as an arg. The script engine resolves it like the other args, through
     * the reference extractor, and hands the script the value as a native string, number, list
     * or map, in every language. The same reference used twice gets one variable.
     *
     * @param code the code of the script, {@code null} for none
     * @param args the args of the script by variable name; left unchanged
     */
    public static BoundScript bindScriptRefs(String code, Map<String, String> args) {
        Map<String, String> bound = new LinkedHashMap<>(args == null ? Map.of() : args);
        List<ScriptRef> refs = findScriptRefs(code);
        if (refs.isEmpty()) {
            return new BoundScript(code, bound);
        }

        Map<String, String> variableByReference = new LinkedHashMap<>();
        StringBuilder replaced = new StringBuilder(code.length());
        int copied = 0;
        for (ScriptRef ref : refs) {
            String variable = variableByReference.computeIfAbsent(ref.reference(), reference -> {
                String name = freeName(bound, variableByReference.size());
                bound.put(name, reference);
                return name;
            });
            replaced.append(code, copied, ref.start()).append(variable);
            copied = ref.end();
        }
        replaced.append(code, copied, code.length());

        return new BoundScript(replaced.toString(), bound);
    }

    // the first OC_REF_n from n on that no arg of the script already uses
    private static String freeName(Map<String, String> args, int n) {
        String name = SCRIPT_REF_VARIABLE + n;
        while (args.containsKey(name)) {
            name = SCRIPT_REF_VARIABLE + ++n;
        }
        return name;
    }

    /**
     * Finds the {@code set("...", value)} calls of a script whose target is a quoted text, in the
     * order they appear. Each is reported with the place of its quoted target, including the
     * quotes, and the target as written, e.g. {@code {{global.lastSync}}}.
     */
    public static List<ScriptRef> findScriptSets(String code) {
        if (code == null || code.indexOf("set") == -1) {
            return List.of();
        }

        List<ScriptRef> found = new ArrayList<>();
        Matcher matcher = SCRIPT_SET.matcher(code);
        while (matcher.find()) {
            found.add(new ScriptRef(matcher.start(1), matcher.end(), matcher.group(2).strip()));
        }

        return found;
    }

    /** Tells whether a script calls {@code set(...)}, whatever it passes as the target. */
    public static boolean callsScriptSet(String code) {
        return code != null && code.indexOf("set") != -1 && SCRIPT_SET_CALL.matcher(code).find();
    }
}
