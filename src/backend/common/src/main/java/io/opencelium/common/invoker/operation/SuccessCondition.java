package io.opencelium.common.invoker.operation;

import java.util.Objects;

/**
 * Decides whether a response means success when its status code cannot.
 *
 * <p>Some APIs answer {@code 200} whether a call worked or not and report failure in the body:
 * JSON-RPC puts an {@code error} member there, GraphQL an {@code errors} array. For those, the
 * status selects the response and this condition classifies it:
 * <pre>{@code
 * <response status="200">
 *     <condition success="body.error == null"/>
 * </response>
 * }</pre>
 *
 * <p>The expression is kept as text. Evaluating it is the execution engine's job, so this type does
 * not interpret it. Add a condition only when the status code genuinely cannot tell the outcome.
 *
 * @param expression an expression evaluated against the parsed response
 */
public record SuccessCondition(String expression) {

    public SuccessCondition {
        Objects.requireNonNull(expression, "success condition must not be null");
        if (expression.isBlank()) {
            throw new IllegalArgumentException("success condition must not be blank");
        }
    }

    public static SuccessCondition of(String expression) {
        return new SuccessCondition(expression);
    }
}
