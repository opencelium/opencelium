package com.becon.opencelium.backend.execution.jump;

import com.becon.opencelium.backend.execution.oc721.Loop;
import com.becon.opencelium.backend.ocel.ExpressionProcessor;
import com.becon.opencelium.backend.ocel.ExpressionProcessorFactory;
import com.becon.opencelium.backend.reference.ReferenceParser;
import com.becon.opencelium.backend.reference.ReferenceScanner;
import com.becon.opencelium.backend.reference.model.DirectReference;
import com.becon.opencelium.backend.reference.model.EnhancementReference;
import com.becon.opencelium.backend.reference.model.Reference;
import com.becon.opencelium.backend.reference.model.WrappedDirectReference;
import com.becon.opencelium.backend.resource.execution.ConnectorEx;
import com.becon.opencelium.backend.resource.execution.FieldBindEx;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import com.becon.opencelium.backend.resource.execution.RequestBodyDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class ExecutionJumpGraphBuilder {

    private static final Pattern DIRECT_REF_COLOR = Pattern.compile("(#[a-zA-Z0-9]{6})\\.\\((?:response|request)\\)");

    private static final ExpressionProcessor EXPRESSION_PROCESSOR = ExpressionProcessorFactory.get();

    private ExecutionJumpGraphBuilder() {
    }

    public static JumpGraph build(ConnectorEx connector, List<FieldBindEx> fieldBindings) {
        if (connector == null) {
            return new JumpGraph(Collections.emptyList());
        }

        Map<String, FieldBindEx> fieldBindingsById = indexFieldBindings(fieldBindings);

        List<JumpNode> nodes = new ArrayList<>();

        if (connector.getMethods() != null) {
            for (OperationDTO operation : connector.getMethods()) {
                nodes.add(JumpNode.method(
                        operation.getExecOrder(),
                        operation.getOperationId(),
                        referencedColors(operation, fieldBindingsById)
                ));
            }
        }

        if (connector.getOperators() != null) {
            for (OperatorEx operator : connector.getOperators()) {
                nodes.add(JumpNode.operator(
                        operator.getIndex(),
                        NodeKind.ofOperatorType(operator.getType()),
                        referencedColors(operator)
                ));
            }
        }

        return new JumpGraph(nodes);
    }

    private static Map<String, FieldBindEx> indexFieldBindings(List<FieldBindEx> fieldBindings) {
        if (fieldBindings == null || fieldBindings.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<String, FieldBindEx> result = new HashMap<>();

        for (FieldBindEx fieldBinding : fieldBindings) {
            if (fieldBinding == null || fieldBinding.getBindId() == null) {
                continue;
            }

            result.put(fieldBinding.getBindId(), fieldBinding);
        }

        return result;
    }

    private static Set<String> referencedColors(OperatorEx operator) {
        Set<String> colors = new HashSet<>();

        if (operator == null || operator.getExpression() == null) {
            return colors;
        }

        if (NodeKind.ofOperatorType(operator.getType()) == NodeKind.LOOP) {
            addColor(loopReference(operator), colors);
            return colors;
        }

        List<String> references = EXPRESSION_PROCESSOR.extractReferences(operator.getExpression());

        if (references != null) {
            for (String reference : references) {
                addColor(reference, colors);
            }
        }

        return colors;
    }

    private static String loopReference(OperatorEx operator) {
        try {
            return Loop.fromOperator(operator).getRef();
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private static Set<String> referencedColors(OperationDTO operation, Map<String, FieldBindEx> fieldBindingsById) {
        Set<String> colors = new HashSet<>();
        List<String> requestValues = new ArrayList<>();

        collectRequestStrings(operation, requestValues);

        Set<String> processedBindIds = new HashSet<>();

        for (String value : requestValues) {
            collectReferencedColors(
                    value,
                    colors,
                    fieldBindingsById,
                    processedBindIds
            );
        }

        colors.remove(operation.getOperationId());

        return colors;
    }

    private static void collectReferencedColors(
            String value,
            Set<String> colors,
            Map<String, FieldBindEx> fieldBindingsById,
            Set<String> processedBindIds
    ) {
        if (value == null || value.isEmpty()) {
            return;
        }

        // plain direct references, including direct references embedded in text.
        addDirectRefColors(value, colors);

        // wrapped direct, enhancement, webhook, page and request-data references.
        for (String rawReference : ReferenceScanner.extract(value)) {
            Reference reference;

            try {
                reference = ReferenceParser.parse(rawReference);
            } catch (RuntimeException ignored) {
                continue;
            }

            if (reference instanceof WrappedDirectReference wrapped) {
                colors.add(wrapped.getDirectReference().getColor());
                continue;
            }

            if (reference instanceof DirectReference direct) {
                colors.add(direct.getColor());
                continue;
            }

            if (reference instanceof EnhancementReference enhancement) {
                collectEnhancementColors(
                        enhancement.getBindId(),
                        colors,
                        fieldBindingsById,
                        processedBindIds
                );
            }
        }
    }

    private static void collectEnhancementColors(
            String bindId,
            Set<String> colors,
            Map<String, FieldBindEx> fieldBindingsById,
            Set<String> processedBindIds
    ) {
        if (bindId == null || !processedBindIds.add(bindId)) {
            return;
        }

        FieldBindEx fieldBinding = fieldBindingsById.get(bindId);

        if (fieldBinding == null || fieldBinding.getEnhance() == null || fieldBinding.getEnhance().getArgs() == null) {
            return;
        }

        for (String argumentValue : fieldBinding.getEnhance().getArgs().values()) {
            collectReferencedColors(
                    argumentValue,
                    colors,
                    fieldBindingsById,
                    processedBindIds
            );
        }
    }

    private static void addColor(String reference, Set<String> colors) {
        String color = colorOf(reference);

        if (color != null) {
            colors.add(color);
        }
    }

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
            // Webhook, request-data, pagination, enhancement or malformed reference.
        }

        return null;
    }

    private static void addDirectRefColors(String text, Set<String> colors) {
        if (text == null) {
            return;
        }

        Matcher matcher = DIRECT_REF_COLOR.matcher(text);

        while (matcher.find()) {
            colors.add(matcher.group(1));
        }
    }

    private static void collectRequestStrings(OperationDTO operation, List<String> result) {
        if (operation == null) {
            return;
        }

        if (operation.getPath() != null) {
            result.add(operation.getPath());
        }

        if (operation.getParameters() != null) {
            operation.getParameters().forEach(parameter -> {
                if (parameter != null) {
                    collectSchemaValues(parameter.getSchema(), result);
                }
            });
        }

        RequestBodyDTO requestBody = operation.getRequestBody();

        if (requestBody != null) {
            collectSchemaValues(requestBody.getSchema(), result);
        }
    }

    private static void collectSchemaValues(SchemaDTO schema, List<String> result) {
        if (schema == null) {
            return;
        }

        if (schema.getValue() != null) {
            result.add(schema.getValue());
        }

        if (schema.getItems() != null) {
            for (SchemaDTO item : schema.getItems()) {
                collectSchemaValues(item, result);
            }
        }

        if (schema.getProperties() != null) {
            for (SchemaDTO property : schema.getProperties().values()) {
                collectSchemaValues(property, result);
            }
        }
    }
}
