package com.becon.opencelium.backend.execution.globalvariable;

import com.becon.opencelium.backend.exception.GlobalVariableNotFoundException;
import com.becon.opencelium.backend.reference.model.GlobalReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Reads the value a global variable reference points to from the snapshot of a run.
 *
 * <p>The result is a plain Java value of the JSON type the variable holds: a string, a number, a
 * boolean, {@code null}, a list or a map. It is built anew on every call, so a caller can never
 * change the snapshot through it.
 */
public final class GlobalValueResolver {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private GlobalValueResolver() {
    }

    /**
     * Resolves {@code reference} against {@code snapshot}.
     *
     * <p>A path that leads nowhere, such as a missing key or an index past the end of an array,
     * resolves to {@code null}.
     *
     * @throws GlobalVariableNotFoundException if the snapshot does not hold the variable
     * @throws IllegalArgumentException        if the path of the reference is malformed
     */
    public static Object resolve(GlobalVariableSnapshot snapshot, GlobalReference reference) {
        return resolve(snapshot, reference.getName(), reference.getPath().orElse(null), reference.getRaw());
    }

    /**
     * Resolves a reference whose path the caller has prepared, for example by putting the current
     * index of a loop in the place of its iterator.
     *
     * @param name name of the variable
     * @param path path into the value, or {@code null} for the whole value
     * @param raw  the reference as written, for error messages
     * @throws GlobalVariableNotFoundException if the snapshot does not hold the variable
     * @throws IllegalArgumentException        if the path is malformed
     */
    public static Object resolve(GlobalVariableSnapshot snapshot, String name, String path, String raw) {
        GlobalVariableSnapshot.Entry entry = snapshot.find(name)
                .orElseThrow(() -> new GlobalVariableNotFoundException(name));

        return read(entry, path, raw);
    }

    /**
     * Resolves a reference written in a connector. A connector is shared by workflows of any
     * category, so it reads only variables that are open to all workflows.
     *
     * @throws GlobalVariableNotFoundException if the snapshot does not hold the variable, or the
     *                                         variable is scoped to some workflows only
     */
    public static Object resolveForConnector(GlobalVariableSnapshot snapshot, GlobalReference reference) {
        GlobalVariableSnapshot.Entry entry = snapshot.find(reference.getName())
                .orElseThrow(() -> new GlobalVariableNotFoundException(reference.getName()));
        if (!entry.openToAll()) {
            throw GlobalVariableNotFoundException.notOpenToAll(reference.getName());
        }

        return read(entry, reference.getPath().orElse(null), reference.getRaw());
    }

    private static Object read(GlobalVariableSnapshot.Entry entry, String path, String raw) {
        JsonNode node = entry.value();
        if (path != null) {
            node = navigate(node, path, raw);
        }

        if (node == null || node.isNull() || node.isMissingNode()) {
            return null;
        }

        return MAPPER.convertValue(node, Object.class);
    }

    /**
     * Walks {@code path} into {@code node}. A path is a chain of fields separated by dots, array
     * indexes in brackets and quoted keys in brackets: {@code limits.maxPerPage}, {@code
     * [0].id}, {@code regions['eu-west'].url}.
     */
    private static JsonNode navigate(JsonNode node, String path, String raw) {
        int position = 0;

        while (position < path.length() && node != null) {
            char current = path.charAt(position);

            if (current == '.') {
                position++;
            } else if (current == '[') {
                int close = closingBracket(path, position);
                if (close == -1) {
                    throw new IllegalArgumentException("Unclosed '[' in the path of " + raw);
                }

                node = step(node, path.substring(position + 1, close).strip(), raw);
                position = close + 1;
            } else {
                int end = endOfField(path, position);
                node = node.get(path.substring(position, end));
                position = end;
            }
        }

        return node;
    }

    private static JsonNode step(JsonNode node, String index, String raw) {
        if (isQuoted(index)) {
            return node.get(index.substring(1, index.length() - 1));
        }

        if (!index.isEmpty() && index.chars().allMatch(Character::isDigit)) {
            // a map has no positions, so a number is its key of that name: a forin loop over
            // {"404": ...} puts [404] in the place of its iterator
            return node.isObject() ? node.get(index) : node.get(Integer.parseInt(index));
        }

        throw new IllegalArgumentException(
                "Index '[%s]' in the path of %s is neither a number nor a quoted key".formatted(index, raw));
    }

    /** Finds the bracket that closes the one at {@code open}; a quoted key may hold a bracket. */
    private static int closingBracket(String path, int open) {
        int start = open + 1;
        while (start < path.length() && Character.isWhitespace(path.charAt(start))) {
            start++;
        }

        if (start < path.length() && (path.charAt(start) == '\'' || path.charAt(start) == '"')) {
            int endOfQuote = path.indexOf(path.charAt(start), start + 1);

            return endOfQuote == -1 ? -1 : path.indexOf(']', endOfQuote + 1);
        }

        return path.indexOf(']', open);
    }

    private static boolean isQuoted(String text) {
        return text.length() >= 2
                && (text.charAt(0) == '\'' || text.charAt(0) == '"')
                && text.charAt(text.length() - 1) == text.charAt(0);
    }

    private static int endOfField(String path, int from) {
        int end = from;
        while (end < path.length() && path.charAt(end) != '.' && path.charAt(end) != '[') {
            end++;
        }

        return end;
    }
}
