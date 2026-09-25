package com.becon.opencelium.backend.execution.jump;

import java.util.Objects;
import java.util.Set;

/**
 * An executable element (method or operator) as the jump validator sees it.
 *
 * <p>Pure value object with no persistence/web coupling so it can be produced from either the
 * persistence model ({@code MethodMng}/{@code OperatorMng}) at save time or the execution model
 * ({@code OperationDTO}/{@code OperatorEx}) at run time.
 *
 * @param index hierarchical numeric path (e.g. {@code 1_1_2_0}); the source of truth for structure
 * @param color 6-char method identifier; {@code null} for operators
 * @param kind  structural role
 */
public record JumpNode(String index, String color, NodeKind kind, Set<String> referencedColors) {

    public JumpNode {
        Objects.requireNonNull(index, "index");
        Objects.requireNonNull(kind, "kind");
        referencedColors = referencedColors == null ? Set.of() : Set.copyOf(referencedColors);
    }

    public static JumpNode method(String index, String color, Set<String> referencedColors) {
        return new JumpNode(index, color, NodeKind.METHOD, referencedColors);
    }

    public static JumpNode operator(String index, NodeKind kind) {
        return new JumpNode(index, null, kind, Set.of());
    }

    public static JumpNode operator(String index, NodeKind kind, Set<String> referencedColors) {
        return new JumpNode(index, null, kind, referencedColors);
    }

    public boolean isOperator() {
        return kind.isOperator();
    }
}