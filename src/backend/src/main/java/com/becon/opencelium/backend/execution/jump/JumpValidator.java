package com.becon.opencelium.backend.execution.jump;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Pure validator for user-defined jumps ({@code source -> target}). No Spring, persistence or web
 * coupling — it works purely against a {@link JumpGraph} and {@link JumpNode}s, so both the
 * connection-save service and the execution engine can share it.
 *
 * <p>Enforces:
 * <ul>
 *   <li>an operator is never a source or a target;</li>
 *   <li>a loop is a ceiling: a method inside a loop cannot jump out of it;</li>
 *   <li>a method cannot jump into a loop or if body it is not part of;</li>
 *   <li>a method may escape outward through enclosing ifs, up to the nearest loop;</li>
 *   <li>the target must be at a reachable level and run strictly after the source.</li>
 * </ul>
 * plus the two structural guards for an absent target and a jump to self.
 *
 * <p>Data dependencies are deliberately <b>not</b> enforced: a method may reference any other
 * method's output, whether or not a jump skips it. The engine resolves an absent reference to an
 * empty value and reports it, instead of failing.
 *
 * <p>The returned list is empty when the jump is valid. Violations are mutually exclusive and
 * returned singly.
 */
public final class JumpValidator {

    private JumpValidator() {
    }

    /**
     * Validates a jump whose target is given as a user-supplied reference (method color, or an index
     * that may point at an operator). Resolves the target — reporting {@code JUMP_TARGET_NOT_FOUND}
     * when it is absent — then delegates to {@link #validate(JumpNode, JumpNode, JumpGraph)}.
     */
    public static List<JumpViolation> validate(JumpNode source, String targetReference, JumpGraph graph) {
        JumpNode target = graph.resolveTarget(targetReference);
        if (target == null) {
            String message = "Jump target '" + targetReference + "' does not exist in this connection.";
            return List.of(new JumpViolation(
                    JumpValidationCode.JUMP_TARGET_NOT_FOUND, message,
                    source.color(), source.index(), null, targetReference));
        }
        return validate(source, target, graph);
    }

    /**
     * Validates a fully resolved {@code source -> target} jump against the graph.
     */
    public static List<JumpViolation> validate(JumpNode source, JumpNode target, JumpGraph graph) {
        // a method cannot jump to itself
        if (source.index().equals(target.index())) {
            return one(JumpValidationCode.JUMP_TO_SELF,
                    "A method cannot jump to itself.", source, target);
        }

        // an operator is never a source
        if (source.isOperator()) {
            return one(JumpValidationCode.JUMP_SOURCE_IS_OPERATOR,
                    "'" + source.index() + "' is a " + source.kind().label()
                            + " operator and cannot start a jump. Move the jump to a method.",
                    source, target);
        }

        // an operator is never a target
        if (target.isOperator()) {
            return one(JumpValidationCode.JUMP_TARGET_IS_OPERATOR,
                    "'" + target.index() + "' is a " + target.kind().label()
                            + " operator and cannot be a jump target. Pick a method instead.",
                    source, target);
        }

        // Which levels can the source reach? Start with its own level, then walk outward through
        // enclosing ifs, stopping at the nearest enclosing loop.
        Map<String, JumpNode> reachable = new LinkedHashMap<>();
        reachable.put(JumpGraph.parentOf(source.index()), source); // own level, anchored at source
        JumpNode loopCeiling = null;
        for (JumpNode container : graph.containersOf(source.index())) {
            if (container.kind() == NodeKind.LOOP) {
                loopCeiling = container; // loop ceiling, cannot escape further
                break;
            }
            // escape one enclosing if to its level
            reachable.putIfAbsent(JumpGraph.parentOf(container.index()), container);
        }

        String targetLevel = JumpGraph.parentOf(target.index());
        if (!reachable.containsKey(targetLevel)) {
            if (loopCeiling != null && !JumpGraph.isWithin(target.index(), loopCeiling.index())) {
                // source is trapped in a loop and the target is outside it
                return one(JumpValidationCode.JUMP_ESCAPES_LOOP,
                        "'" + source.index() + "' is inside loop '" + loopCeiling.index()
                                + "' and can only jump within that loop's body. '"
                                + target.index() + "' is outside the loop.",
                        source, target);
            }
            // target sits inside an operator body the source is not part of
            JumpNode op = blockingOperator(source, target, graph);
            return one(JumpValidationCode.JUMP_TARGET_INSIDE_OPERATOR,
                    "'" + target.index() + "' is inside the " + op.kind().label() + " '" + op.index()
                            + "', which '" + source.index() + "' is not part of. "
                            + "Jump only to methods at your own level or an enclosing level.",
                    source, target);
        }

        // forward-only: the target must come after the level's anchor
        JumpNode anchor = reachable.get(targetLevel);
        if (JumpGraph.compareIndex(target.index(), anchor.index()) <= 0) {
            return one(JumpValidationCode.JUMP_BACKWARD,
                    "'" + target.index() + "' runs before '" + source.index()
                            + "'. Jumps must go forward.",
                    source, target);
        }

        // A jump never invalidates a reference: a method may consume data from any node, including
        // one this jump skips. An unresolved reference is reported to the execution log and
        // substituted with an empty value at run time, so it must not block the jump here.
        return List.of();
    }

    /**
     * Innermost operator that contains {@code target} but not {@code source} — the body the jump
     * would illegally enter.
     */
    private static JumpNode blockingOperator(JumpNode source, JumpNode target, JumpGraph graph) {
        Set<String> sourceContainers = graph.containersOf(source.index()).stream()
                .map(JumpNode::index)
                .collect(Collectors.toSet());
        List<JumpNode> targetContainers = graph.containersOf(target.index());
        for (JumpNode container : targetContainers) {
            if (!sourceContainers.contains(container.index())) {
                return container;
            }
        }
        return targetContainers.get(0); // unreachable for an actual into-body violation
    }

    private static List<JumpViolation> one(JumpValidationCode code, String message, JumpNode source, JumpNode target) {
        return List.of(new JumpViolation(
                code, message,
                source.color(), source.index(),
                target.color(), target.index()));
    }
}
