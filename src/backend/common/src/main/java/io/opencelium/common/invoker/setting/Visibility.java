package io.opencelium.common.invoker.setting;

import java.util.Arrays;

/** How a connector setting is presented and stored. */
public enum Visibility {

    /** The user types the value and can read it back. For URLs, usernames and similar. */
    PUBLIC("public"),

    /** The user types the value, but it is masked in the UI and encrypted at rest. For credentials. */
    PROTECTED("protected"),

    /** The user never sees the setting. Its value is derived at execution time from a source. */
    PRIVATE("private");

    private final String value;

    Visibility(String value) {
        this.value = value;
    }

    /** The name used in an invoker file's {@code visibility} attribute. */
    public String value() {
        return value;
    }

    /**
     * Resolves a visibility from its name, ignoring case.
     *
     * @throws IllegalArgumentException if the name is not a visibility
     */
    public static Visibility fromValue(String value) {
        return Arrays.stream(values())
                .filter(visibility -> visibility.value.equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("'" + value + "' is not a visibility; "
                        + "expected public, protected or private"));
    }
}
