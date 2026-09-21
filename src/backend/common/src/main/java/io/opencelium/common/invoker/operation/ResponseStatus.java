package io.opencelium.common.invoker.operation;

import java.util.Objects;

/**
 * Which HTTP status codes a {@link Response} applies to: one exact code, a whole class such as
 * {@code 4XX}, or {@code default} for anything else. These are the forms OpenAPI 3.1 uses.
 *
 * <p>When several responses match, the most {@link #specificity() specific} wins, so an operation can
 * describe the interesting codes precisely and catch the rest once:
 * <pre>{@code
 * <response status="404"/>       <!-- exact:   specificity 2 -->
 * <response status="4XX"/>       <!-- class:   specificity 1 -->
 * <response status="default"/>   <!-- default: specificity 0 -->
 * }</pre>
 */
public sealed interface ResponseStatus permits ResponseStatus.Exact, ResponseStatus.Range, ResponseStatus.Default {

    /** The status that matches every code not matched by something more specific. */
    Default DEFAULT = new Default();

    /** Whether a response with this status code is covered. */
    boolean matches(int statusCode);

    /** Higher wins when several statuses match: exact 2, class 1, default 0. */
    int specificity();

    /** The form used in an invoker file: {@code 404}, {@code 4XX} or {@code default}. */
    String value();

    static Exact of(int code) {
        return new Exact(code);
    }

    /**
     * Parses a status as written in an invoker file.
     *
     * <p>A lower-case wildcard such as {@code 4xx} is accepted and normalised to {@code 4XX}.
     *
     * @throws IllegalArgumentException if the text is none of the three forms
     */
    static ResponseStatus parse(String value) {
        Objects.requireNonNull(value, "response status must not be null");
        String text = value.trim();
        if (text.equalsIgnoreCase("default")) {
            return DEFAULT;
        }
        if (text.length() == 3 && Character.isDigit(text.charAt(0))
                && (text.charAt(1) == 'X' || text.charAt(1) == 'x')
                && (text.charAt(2) == 'X' || text.charAt(2) == 'x')) {
            return new Range(text.charAt(0) - '0');
        }
        if (text.length() == 3 && text.chars().allMatch(Character::isDigit)) {
            return new Exact(Integer.parseInt(text));
        }
        throw new IllegalArgumentException("'" + value + "' is not a response status; "
                + "expected a code such as 404, a class such as 4XX, or default");
    }

    /** One status code, such as {@code 404}. */
    record Exact(int code) implements ResponseStatus {

        public Exact {
            if (code < 100 || code > 599) {
                throw new IllegalArgumentException("status code " + code + " is outside 100-599");
            }
        }

        @Override
        public boolean matches(int statusCode) {
            return statusCode == code;
        }

        @Override
        public int specificity() {
            return 2;
        }

        @Override
        public String value() {
            return String.valueOf(code);
        }
    }

    /** Every code in one hundred, such as {@code 4XX} for 400-499. */
    record Range(int statusClass) implements ResponseStatus {

        public Range {
            if (statusClass < 1 || statusClass > 5) {
                throw new IllegalArgumentException("status class " + statusClass + "XX is outside 1XX-5XX");
            }
        }

        @Override
        public boolean matches(int statusCode) {
            return statusCode / 100 == statusClass;
        }

        @Override
        public int specificity() {
            return 1;
        }

        @Override
        public String value() {
            return statusClass + "XX";
        }
    }

    /** Anything not covered by a more specific status. */
    record Default() implements ResponseStatus {

        @Override
        public boolean matches(int statusCode) {
            return true;
        }

        @Override
        public int specificity() {
            return 0;
        }

        @Override
        public String value() {
            return "default";
        }
    }
}
