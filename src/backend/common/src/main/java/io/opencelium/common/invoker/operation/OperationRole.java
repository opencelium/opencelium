package io.opencelium.common.invoker.operation;

import java.util.Arrays;
import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

/** A special purpose an operation serves, beyond being an ordinary step in a workflow. */
public enum OperationRole {

    /** Run by the Test connection action. It should be cheap and change nothing on the remote side. */
    TEST("test"),

    /** Run to obtain credentials, such as a session token, that other operations then send. */
    AUTH("auth");

    private final String value;

    OperationRole(String value) {
        this.value = value;
    }

    /** The name used in an invoker file's {@code roles} attribute. */
    public String value() {
        return value;
    }

    /**
     * Resolves a role from its name, ignoring case.
     *
     * @throws IllegalArgumentException if the name is not a role
     */
    public static OperationRole fromValue(String value) {
        return Arrays.stream(values())
                .filter(role -> role.value.equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("'" + value + "' is not an operation role; "
                        + "expected " + Arrays.stream(values()).map(OperationRole::value).toList()));
    }

    /**
     * Parses a {@code roles} attribute: role names separated by whitespace, such as {@code "test auth"}.
     * A blank attribute means no roles, and a repeated name counts once.
     *
     * @throws IllegalArgumentException if any name is not a role
     */
    public static Set<OperationRole> parseAll(String roles) {
        String trimmed = roles.trim();
        if (trimmed.isEmpty()) {
            return Set.of();
        }
        Set<OperationRole> parsed = EnumSet.noneOf(OperationRole.class);
        for (String name : trimmed.split("\\s+")) {
            parsed.add(fromValue(name));
        }
        return Collections.unmodifiableSet(parsed);
    }
}
