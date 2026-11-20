package com.becon.opencelium.backend.validation.connection;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.database.mongodb.entity.BodyMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConditionMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.EnhancementMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.entity.LinkedFieldMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.database.mongodb.entity.RequestMng;
import com.becon.opencelium.backend.database.mongodb.entity.StatementMng;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage.ElementType;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * Finds every global variable reference a workflow holds, or a set of named texts outside a
 * workflow: the request data of a connector, the subject and body of a notification template.
 *
 * <p>In a workflow it looks where a run resolves references: the endpoint, the headers and the
 * body of every method, the expression and the condition of every operator, and the args and
 * the code of every field binding's enhancement, where code reads a variable through {@code
 * ref("{{global.name}}")}. An escaped token, {@code \{{global.name}}}, is literal text and is not
 * reported.
 */
public final class GlobalReferenceCollector {

    private static final Pattern GLOBAL_REFERENCE = Pattern.compile(RegExpression.globalRef);

    private GlobalReferenceCollector() {
    }

    /**
     * One reference and the element that holds it.
     *
     * @param elementType kind of the element, {@code null} outside a workflow
     * @param color       color of the element if it is a method, otherwise {@code null}
     * @param index       index path of the element, {@code null} outside a workflow
     * @param label       what the editor calls the element, {@code null} outside a workflow
     * @param field       where the reference stands: in an element e.g. {@code
     *                    body.filter.since}, outside a workflow the name of the text
     * @param variable    name of the referenced variable
     * @param reference   the reference as written, e.g. {@code {{global.limits.maxPerPage}}}
     */
    public record Found(ElementType elementType, String color, String index, String label, String field,
                        String variable, String reference) {
    }

    /** Returns the references of {@code connection} in the order its elements hold them. */
    public static List<Found> collect(ConnectionMng connection) {
        List<Found> found = new ArrayList<>();
        if (connection == null) {
            return found;
        }

        collect(connection.getFromConnector(), found);
        collect(connection.getToConnector(), found);
        collectFieldBindings(connection, found);

        return found;
    }

    /**
     * Returns the references of texts that belong to no workflow element, in the order of the
     * texts. Each reference is reported with the name of its text as the field.
     *
     * @param texts the texts by name, e.g. the values of a connector's request data by field
     */
    public static List<Found> collectFromTexts(Map<String, String> texts) {
        List<Found> found = new ArrayList<>();
        if (texts == null) {
            return found;
        }

        Element outsideWorkflow = new Element(null, null, null, null, found);
        texts.forEach(outsideWorkflow::scan);

        return found;
    }

    private static void collect(ConnectorMng connector, List<Found> found) {
        if (connector == null) {
            return;
        }

        if (connector.getMethods() != null) {
            connector.getMethods().stream()
                    .filter(method -> method != null && method.getRequest() != null)
                    .forEach(method -> collect(method, found));
        }

        if (connector.getOperators() != null) {
            connector.getOperators().stream()
                    .filter(operator -> operator != null)
                    .forEach(operator -> collect(operator, found));
        }
    }

    private static void collect(MethodMng method, List<Found> found) {
        String label = method.getLabel() != null ? method.getLabel() : method.getName();
        Element element = new Element(ElementType.METHOD, method.getColor(), method.getIndex(), label, found);

        RequestMng request = method.getRequest();
        element.scan("endpoint", request.getEndpoint());

        if (request.getHeader() != null) {
            request.getHeader().forEach((name, value) -> element.scan("header." + name, value));
        }

        BodyMng body = request.getBody();
        if (body != null && body.getFields() != null) {
            body.getFields().forEach((name, value) -> element.scanValue("body." + name, value));
        }
    }

    private static void collect(OperatorMng operator, List<Found> found) {
        Element element = new Element(ElementType.OPERATOR, null, operator.getIndex(), operator.getType(), found);

        element.scan("expression", operator.getExpression());

        ConditionMng condition = operator.getCondition();
        if (condition != null) {
            scan(element, "condition.left", condition.getLeftStatement());
            scan(element, "condition.right", condition.getRightStatement());
        }
    }

    /**
     * Reports the references of each field binding's enhancement against the method the binding
     * fills, so the usage list can open that method.
     */
    private static void collectFieldBindings(ConnectionMng connection, List<Found> found) {
        if (connection.getFieldBindings() == null) {
            return;
        }

        for (FieldBindingMng binding : connection.getFieldBindings()) {
            EnhancementMng enhancement = binding == null ? null : binding.getEnhancement();
            if (enhancement == null) {
                continue;
            }

            String color = targetColor(binding);
            String index = indexOfMethod(connection, color);
            String label = enhancement.getTitle();
            Element element = new Element(ElementType.ENHANCEMENT, color, index, label, found);

            element.scan("enhancement.args", enhancement.getArgs());
            element.scan("enhancement.script", enhancement.getScript());
        }
    }

    // the color of the method the binding writes into; null for a binding without a target
    private static String targetColor(FieldBindingMng binding) {
        if (binding.getTo() == null) {
            return null;
        }

        return binding.getTo().stream()
                .filter(linked -> linked != null && linked.getColor() != null)
                .map(LinkedFieldMng::getColor)
                .findFirst()
                .orElse(null);
    }

    private static String indexOfMethod(ConnectionMng connection, String color) {
        if (color == null) {
            return null;
        }

        return Stream.of(connection.getFromConnector(), connection.getToConnector())
                .filter(connector -> connector != null && connector.getMethods() != null)
                .flatMap(connector -> connector.getMethods().stream())
                .filter(method -> method != null && color.equals(method.getColor()))
                .map(MethodMng::getIndex)
                .findFirst()
                .orElse(null);
    }

    private static void scan(Element element, String field, StatementMng statement) {
        if (statement == null) {
            return;
        }

        element.scan(field + ".field", statement.getField());
        element.scan(field + ".rightPropertyValue", statement.getRightPropertyValue());
    }

    /** An element being scanned: every reference found in it is reported with its position. */
    private record Element(ElementType type, String color, String index, String label, List<Found> found) {

        /** Scans a body value of any JSON shape: a text, a map or a list of further values. */
        void scanValue(String field, Object value) {
            if (value instanceof String text) {
                scan(field, text);
            } else if (value instanceof Map<?, ?> map) {
                map.forEach((key, nested) -> scanValue(field + "." + key, nested));
            } else if (value instanceof Collection<?> items) {
                int position = 0;
                for (Object item : items) {
                    scanValue(field + "[" + position++ + "]", item);
                }
            }
        }

        void scan(String field, String text) {
            if (text == null || text.indexOf('{') == -1) {
                return;
            }

            Matcher matcher = GLOBAL_REFERENCE.matcher(text);
            while (matcher.find()) {
                found.add(new Found(type, color, index, label, field, matcher.group(1), matcher.group()));
            }
        }
    }
}
