package com.becon.opencelium.backend.execution.jump;

import com.becon.opencelium.backend.database.mongodb.entity.BodyMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.entity.LinkedFieldMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.database.mongodb.entity.RequestMng;
import com.becon.opencelium.backend.execution.oc721.Loop;
import com.becon.opencelium.backend.ocel.ExpressionProcessor;
import com.becon.opencelium.backend.ocel.ExpressionProcessorFactory;
import com.becon.opencelium.backend.reference.ReferenceParser;
import com.becon.opencelium.backend.reference.model.DirectReference;
import com.becon.opencelium.backend.reference.model.Reference;
import com.becon.opencelium.backend.reference.model.WrappedDirectReference;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Builds a pure {@link JumpGraph} from the persistence model of a single connector.
 *
 * <p>Resolves each element's referenced colors — needed to detect a jump that would skip a method it
 * depends on — from:
 * <ul>
 *   <li>direct references embedded in a method's request ({@code #color.(response|request)...}),</li>
 *   <li>field bindings whose {@code to} side is the method — its referenced colors are the
 *       {@code from} colors,</li>
 *   <li>direct references inside an operator's if/loop {@code expression} (e.g.
 *       {@code forin {%#color.(response).body.$.[*]%}}), which loop/if bodies consume.</li>
 * </ul>
 */
public final class MongoJumpGraphBuilder {

    /**
     * Matches a direct reference and captures the method color <b>including</b> its leading
     * {@code #}, so it lines up with {@code MethodMng.color} (which is stored as {@code #RRGGBB}).
     */
    private static final Pattern DIRECT_REF_COLOR =
            Pattern.compile("(#[a-zA-Z0-9]{6})\\.\\((?:response|request)\\)");

    /**
     * Owns OCEL expression parsing; used to pull references out of if expressions.
     */
    private static final ExpressionProcessor EXPRESSION_PROCESSOR = ExpressionProcessorFactory.get();

    private MongoJumpGraphBuilder() {
    }

    public static JumpGraph build(ConnectorMng connector, List<FieldBindingMng> fieldBindings) {
        List<JumpNode> nodes = new ArrayList<>();

        if (connector.getMethods() != null) {
            for (MethodMng method : connector.getMethods()) {
                nodes.add(JumpNode.method(
                        method.getIndex(),
                        method.getColor(),
                        referencedColors(method, fieldBindings)));
            }
        }

        if (connector.getOperators() != null) {
            for (OperatorMng operator : connector.getOperators()) {
                nodes.add(JumpNode.operator(
                        operator.getIndex(),
                        NodeKind.ofOperatorType(operator.getType()),
                        referencedColors(operator)));
            }
        }

        return new JumpGraph(nodes);
    }

    /**
     * Colors an operator consumes, parsed from the {@code expression} the executor evaluates. A loop
     * iterates over a single reference, resolved via {@link Loop} (which owns loop-expression
     * parsing); an if consumes the references in its boolean expression, resolved via the
     * {@link ExpressionProcessor}.
     */
    private static Set<String> referencedColors(OperatorMng operator) {
        Set<String> colors = new HashSet<>();
        if (NodeKind.ofOperatorType(operator.getType()) == NodeKind.LOOP) {
            addColor(loopReference(operator), colors);
        } else {
            List<String> refs = EXPRESSION_PROCESSOR.extractReferences(operator.getExpression());
            if (refs != null) {
                refs.forEach(x -> addColor(x, colors));
            }
        }
        return colors;
    }

    /**
     * Reference a loop iterates over, extracted with the executor's own {@link Loop} parser.
     */
    private static String loopReference(OperatorMng operator) {
        try {
            return Loop.fromExpression(operator.getExpression()).getRef();
        } catch (RuntimeException e) {
            return null; // malformed / unsupported loop expression — nothing to resolve
        }
    }

    private static void addColor(String reference, Set<String> colors) {
        String color = colorOf(reference);
        if (color != null) {
            colors.add(color);
        }
    }

    /**
     * Resolves a raw reference to the method color it points at, or {@code null} if it names no method.
     */
    private static String colorOf(String reference) {
        if (reference == null) {
            return null;
        }
        try {
            Reference parsed = ReferenceParser.parse(reference);
            if (parsed instanceof WrappedDirectReference wrapped) {
                return wrapped.getDirectReference().getColor();
            }
            if (parsed instanceof DirectReference direct) {
                return direct.getColor();
            }
        } catch (RuntimeException ignored) {
            // not a color-bearing reference (webhook / request-data / enhancement / malformed)
        }
        return null;
    }

    private static Set<String> referencedColors(MethodMng method, List<FieldBindingMng> fieldBindings) {
        Set<String> colors = new HashSet<>();

        // 1) direct references inside the method's request
        List<String> requestStrings = new ArrayList<>();
        collectRequestStrings(method.getRequest(), requestStrings);
        for (String s : requestStrings) {
            addDirectRefColors(s, colors);
        }

        // 2) field bindings feeding this method (from-colors)
        if (fieldBindings != null && method.getColor() != null) {
            for (FieldBindingMng fb : fieldBindings) {
                if (consumes(fb, method.getColor())) {
                    addFromColors(fb, colors);
                }
            }
        }

        colors.remove(method.getColor()); // a method never "skips" itself
        return colors;
    }

    /**
     * Adds every direct-reference color (with its leading {@code #}) found in {@code text}.
     */
    private static void addDirectRefColors(String text, Set<String> colors) {
        if (text == null) {
            return;
        }
        Matcher matcher = DIRECT_REF_COLOR.matcher(text);
        while (matcher.find()) {
            colors.add(matcher.group(1));
        }
    }

    private static boolean consumes(FieldBindingMng fb, String methodColor) {
        if (fb.getTo() == null) {
            return false;
        }
        for (LinkedFieldMng to : fb.getTo()) {
            if (methodColor.equals(to.getColor())) {
                return true;
            }
        }
        return false;
    }

    private static void addFromColors(FieldBindingMng fb, Set<String> colors) {
        if (fb.getFrom() == null) {
            return;
        }
        for (LinkedFieldMng from : fb.getFrom()) {
            if (from.getColor() != null) {
                colors.add(from.getColor());
            }
        }
    }

    private static void collectRequestStrings(RequestMng request, List<String> out) {
        if (request == null) {
            return;
        }
        if (request.getEndpoint() != null) {
            out.add(request.getEndpoint());
        }
        if (request.getHeader() != null) {
            out.addAll(request.getHeader().values());
        }
        BodyMng body = request.getBody();
        if (body != null) {
            if (body.getData() != null) {
                out.add(body.getData());
            }
            collectValues(body.getFields(), out);
        }
    }

    private static void collectValues(Object value, List<String> out) {
        if (value instanceof String s) {
            out.add(s);
        } else if (value instanceof Map<?, ?> map) {
            for (Object v : map.values()) {
                collectValues(v, out);
            }
        } else if (value instanceof Collection<?> collection) {
            for (Object v : collection) {
                collectValues(v, out);
            }
        }
    }
}
