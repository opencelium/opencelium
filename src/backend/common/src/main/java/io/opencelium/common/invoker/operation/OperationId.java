package io.opencelium.common.invoker.operation;

import java.util.Objects;
import java.util.regex.Pattern;

/**
 * The permanent identifier of an operation within its invoker.
 *
 * <p>Workflow nodes are stored against this id, so it must never change once workflows use the
 * operation. The operation's display name is separate and free to change.
 *
 * <p>Dots are allowed because real APIs name operations that way, for example {@code cmdb.objects.read}.
 */
public record OperationId(String value) {

    private static final int MAX_LENGTH = 200;
    private static final Pattern FORMAT = Pattern.compile("[A-Za-z0-9_.\\-]+");

    public OperationId {
        Objects.requireNonNull(value, "operation id must not be null");
        if (value.isBlank()) {
            throw new IllegalArgumentException("operation id must not be blank");
        }
        if (value.length() > MAX_LENGTH) {
            throw new IllegalArgumentException("operation id must not exceed " + MAX_LENGTH + " characters");
        }
        if (!FORMAT.matcher(value).matches()) {
            throw new IllegalArgumentException("'" + value + "' is not a valid operation id; "
                    + "use letters, digits, '.', '_' and '-'");
        }
    }

    public static OperationId of(String value) {
        return new OperationId(value);
    }

    @Override
    public String toString() {
        return value;
    }
}
