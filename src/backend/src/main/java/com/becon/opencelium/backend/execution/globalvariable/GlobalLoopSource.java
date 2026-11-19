package com.becon.opencelium.backend.execution.globalvariable;

import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.execution.oc721.Loop;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.IntStream;

/**
 * A global variable as the source of a loop.
 *
 * <p>{@code for} walks an array, {@code forin} the keys of a map or the indexes of an array, and
 * {@code SplitString} the parts of a string; a value of another type fails the loop. Inside the
 * loop a reference reaches the current element by the iterator of the loop: {@code
 * {{global.tenants[i].id}}} for an index, {@code {{global.regions['j'].url}}} for a key, {@code
 * {{global.csv[k]~}}} for the current part of a split.
 */
public final class GlobalLoopSource {

    // [i], ['i'] or ["i"]: a single letter that may be the iterator of a loop
    private static final Pattern ITERATOR =
            Pattern.compile("\\[\\s*(?:'([A-Za-z])'|\"([A-Za-z])\"|([A-Za-z]))\\s*\\]");

    // the current part of a split, written [k]~ at the end of the path
    private static final Pattern SPLIT_TOKEN = Pattern.compile("\\[\\s*([A-Za-z])\\s*\\]~\\s*$");

    private GlobalLoopSource() {
    }

    /**
     * Returns what a loop over a global variable iterates: the indexes of an array for {@code
     * for}, the keys of a map or the indexes of an array for {@code forin}, the parts of a
     * string for {@code SplitString}.
     *
     * @param loop  the loop; its reference is only used in the error message
     * @param value the value of the variable, never {@code null}
     * @throws IllegalArgumentException if the value has a type the loop cannot walk
     */
    public static List<String> valuesOf(Loop loop, Object value) {
        return switch (loop.getOperator()) {
            case FOR -> {
                if (value instanceof Collection<?> items) {
                    yield indexes(items.size());
                }
                throw wrongType(loop, "an array", value);
            }
            case FOR_IN -> {
                if (value instanceof Map<?, ?> map) {
                    yield map.keySet().stream().map(String::valueOf).toList();
                }
                if (value instanceof Collection<?> items) {
                    yield indexes(items.size());
                }
                throw wrongType(loop, "an array or a map", value);
            }
            case SPLIT_STRING -> {
                if (value instanceof String text) {
                    yield List.of(text.split(loop.getDelimiter()));
                }
                throw wrongType(loop, "a string", value);
            }
            default -> throw new IllegalArgumentException(
                    "Operator %s cannot loop over %s".formatted(loop.getOperator(), loop.getRef()));
        };
    }

    /**
     * Returns the current part of a split when {@code path} asks for it: it ends with {@code
     * [k]~} and {@code k} is the iterator of a {@code SplitString} loop that is running.
     */
    public static Optional<String> splitToken(String path, List<Loop> loops) {
        Matcher matcher = SPLIT_TOKEN.matcher(path);
        if (!matcher.find()) {
            return Optional.empty();
        }

        return loops.stream()
                .filter(loop -> loop.getOperator() == RelationalOperator.SPLIT_STRING)
                .filter(loop -> Objects.equals(loop.getIterator(), matcher.group(1)))
                .map(Loop::getValue)
                .findFirst();
    }

    /**
     * Tells whether {@code path} names the iterator of a loop: {@code [i]}, {@code ['i']} or
     * {@code ["i"]}, also as the current part of a split, {@code [k]~}. Such a path has its
     * meaning only while the loop runs. A single quoted letter counts too, although outside a loop
     * it reads the key of that name: where the loops are unknown, it cannot be told apart.
     */
    public static boolean namesIterator(String path) {
        return path != null && ITERATOR.matcher(path).find();
    }

    /**
     * Puts the current value of each running loop in the place of its iterator: {@code [i]} and
     * {@code ['i']} become an index such as {@code [2]} or a quoted key such as {@code
     * ['eu-west']}. A letter that is no iterator of a running loop is left as it is.
     */
    public static String withLoopValues(String path, List<Loop> loops) {
        Matcher matcher = ITERATOR.matcher(path);
        StringBuilder result = new StringBuilder(path.length());
        int cursor = 0;

        while (matcher.find()) {
            String iterator = matcher.group(1) != null ? matcher.group(1)
                    : matcher.group(2) != null ? matcher.group(2) : matcher.group(3);
            Optional<String> value = loops.stream()
                    .filter(loop -> Objects.equals(loop.getIterator(), iterator))
                    .map(Loop::getValue)
                    .filter(Objects::nonNull)
                    .findFirst();

            if (value.isPresent()) {
                result.append(path, cursor, matcher.start()).append(asIndex(value.get()));
                cursor = matcher.end();
            }
        }

        return result.append(path, cursor, path.length()).toString();
    }

    private static String asIndex(String value) {
        if (!value.isEmpty() && value.chars().allMatch(Character::isDigit)) {
            return "[" + value + "]";
        }

        // quoted with the quote the key does not hold
        return value.contains("'") ? "[\"" + value + "\"]" : "['" + value + "']";
    }

    private static List<String> indexes(int size) {
        return IntStream.range(0, size).mapToObj(String::valueOf).toList();
    }

    private static IllegalArgumentException wrongType(Loop loop, String needed, Object value) {
        return new IllegalArgumentException("%s needs %s, but %s is %s".formatted(
                nameOf(loop.getOperator()), needed, loop.getRef(), typeOf(value)));
    }

    private static String nameOf(RelationalOperator operator) {
        return switch (operator) {
            case FOR -> "for";
            case FOR_IN -> "forin";
            case SPLIT_STRING -> "SplitString";
            default -> operator.name();
        };
    }

    private static String typeOf(Object value) {
        if (value instanceof Map<?, ?>) {
            return "a map";
        }
        if (value instanceof Collection<?>) {
            return "an array";
        }
        if (value instanceof String) {
            return "a string";
        }
        if (value instanceof Number) {
            return "a number";
        }

        return value instanceof Boolean ? "a boolean" : "a " + value.getClass().getSimpleName();
    }
}
