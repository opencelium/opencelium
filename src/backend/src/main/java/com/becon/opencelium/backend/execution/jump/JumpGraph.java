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

    /** Nodes ordered the same way the executor walks the connector. */
    private final List<JumpNode> ordered;
    private final Map<String, JumpNode> byIndex;
    private final Map<String, JumpNode> methodByColor;
    private final Map<String, Integer> positionByIndex;

    public JumpGraph(List<JumpNode> nodes) {
        this.ordered = new ArrayList<>(nodes);
        this.ordered.sort(Comparator.comparing(JumpNode::index, Comparators.NUMERIC_PARTS));

        this.byIndex = new HashMap<>();
        this.methodByColor = new HashMap<>();
        this.positionByIndex = new HashMap<>();
        for (int i = 0; i < ordered.size(); i++) {
            JumpNode node = ordered.get(i);
            byIndex.put(node.index(), node);
            positionByIndex.put(node.index(), i);
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

    /** Zero-based position of a node in the executor's walk order. */
    public int positionOf(JumpNode node) {
        return positionByIndex.get(node.index());
    }

    /**
     * Last position occupied by {@code node}'s subtree — for a leaf method this is its own position,
     * for an operator the last element of its body. Mirrors {@code ConnectorExecutor.getTailPointer}.
     */
    public int tailPositionOf(JumpNode node) {
        String prefix = node.index() + "_";
        int tail = positionOf(node);
        for (int i = tail + 1; i < ordered.size(); i++) {
            if (ordered.get(i).index().startsWith(prefix)) {
                tail = i;
            } else {
                break;
            }
        }
        return tail;
    }

    /** Methods strictly between {@code source}'s tail and {@code target} in the walk order. */
    public List<JumpNode> methodsBetween(JumpNode source, JumpNode target) {
        int from = tailPositionOf(source);
        int to = positionOf(target);
        List<JumpNode> result = new ArrayList<>();
        for (int i = from + 1; i < to && i < ordered.size(); i++) {
            JumpNode node = ordered.get(i);
            if (!node.isOperator()) {
                result.add(node);
            }
        }
        return result;
    }

    /**
     * Executables that still run once the jump lands — {@code node} and everything after it in the
     * walk order, methods and operators alike. These are the elements whose references could dangle
     * if the jump skips a method they depend on (a loop/if expression consumes methods too).
     */
    public List<JumpNode> executablesAtOrAfter(JumpNode node) {
        return new ArrayList<>(ordered.subList(positionOf(node), ordered.size()));
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
