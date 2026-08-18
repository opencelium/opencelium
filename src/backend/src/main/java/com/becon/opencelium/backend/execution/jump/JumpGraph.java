package com.becon.opencelium.backend.execution.jump;

import com.becon.opencelium.backend.utility.Comparators;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Pure, in-memory view of a single connector's executables, ordered the same way the executor walks
 * them ({@link Comparators#NUMERIC_PARTS} over the {@code index} path). Provides the structural
 * queries {@link JumpValidator} needs — lookup by index/color, container operators, level, linear
 * position and tail — with no Spring or persistence coupling.
 *
 * <p>Build it from persistence entities via {@code MongoJumpGraphBuilder}, or directly from
 * execution DTOs.
 */
public final class JumpGraph {

    private final Map<String, JumpNode> byIndex;
    private final Map<String, JumpNode> methodByColor;

    public JumpGraph(List<JumpNode> nodes) {
        // Ordered the same way the executor walks the connector, so structural derivations stay consistent.
        List<JumpNode> ordered = new ArrayList<>(nodes);
        ordered.sort(Comparator.comparing(JumpNode::index, Comparators.NUMERIC_PARTS));

        this.byIndex = new HashMap<>();
        this.methodByColor = new HashMap<>();
        for (JumpNode node : ordered) {
            byIndex.put(node.index(), node);
            if (!node.isOperator() && node.color() != null) {
                methodByColor.put(node.color(), node);
            }
        }
    }

    /** Node with the exact index, or {@code null}. */
    public JumpNode byIndex(String index) {
        return byIndex.get(index);
    }

    /** Method with the given color, or {@code null}. */
    public JumpNode methodByColor(String color) {
        return methodByColor.get(color);
    }

    /**
     * Resolves a user-supplied jump target reference to a node. A method color is tried first
     * (the stable identity used by references), falling back to an exact index match so an operator
     * — which has no color — can still be resolved (and later rejected as an operator target).
     * {@code null} if the reference matches nothing in this connector.
     */
    public JumpNode resolveTarget(String reference) {
        if (reference == null) {
            return null;
        }
        JumpNode method = methodByColor.get(reference);
        return method != null ? method : byIndex.get(reference);
    }

    /** Container operators of {@code index}, innermost-first ({@code 1_1_1_0} -> {@code 1_1_1, 1_1, 1}). */
    public List<JumpNode> containersOf(String index) {
        List<JumpNode> result = new ArrayList<>();
        String current = parentOf(index);
        while (!current.isEmpty()) {
            JumpNode node = byIndex.get(current);
            if (node != null) {
                result.add(node);
            }
            current = parentOf(current);
        }
        return result;
    }

    /**
     * Parent-level identifier of an index — the shared prefix of same-level siblings. The empty
     * string denotes the root level.
     */
    public static String parentOf(String index) {
        int last = index.lastIndexOf('_');
        return last < 0 ? "" : index.substring(0, last);
    }

    /** {@code true} if {@code descendant} lies within {@code ancestor}'s subtree. */
    public static boolean isWithin(String descendant, String ancestor) {
        return descendant.startsWith(ancestor + "_");
    }

    /** Numeric-path comparison: negative if {@code a} runs before {@code b}. */
    public static int compareIndex(String a, String b) {
        return Comparators.NUMERIC_PARTS.compare(a, b);
    }
}
