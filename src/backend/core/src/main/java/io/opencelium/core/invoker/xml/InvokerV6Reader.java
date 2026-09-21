package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import io.opencelium.common.http.ContentType;
import io.opencelium.common.http.Header;
import io.opencelium.common.invoker.Invoker;
import io.opencelium.common.invoker.operation.Body;
import io.opencelium.common.invoker.operation.Operation;
import io.opencelium.common.invoker.operation.OperationRole;
import io.opencelium.common.invoker.operation.QueryParameter;
import io.opencelium.common.invoker.operation.QueryStyle;
import io.opencelium.common.invoker.operation.Request;
import io.opencelium.common.invoker.operation.Response;
import io.opencelium.common.invoker.operation.ResponseStatus;
import io.opencelium.common.invoker.operation.SuccessCondition;
import io.opencelium.common.invoker.operation.XmlNamespace;
import io.opencelium.common.invoker.pagination.PageAction;
import io.opencelium.common.invoker.pagination.PageParam;
import io.opencelium.common.invoker.pagination.PageRule;
import io.opencelium.common.invoker.pagination.Pagination;
import io.opencelium.common.invoker.schema.ArraySchema;
import io.opencelium.common.invoker.schema.Field;
import io.opencelium.common.invoker.schema.ObjectSchema;
import io.opencelium.common.invoker.schema.ScalarSchema;
import io.opencelium.common.invoker.schema.ScalarType;
import io.opencelium.common.invoker.schema.Schema;
import io.opencelium.common.invoker.schema.UndefinedSchema;
import io.opencelium.common.invoker.schema.Value;
import io.opencelium.common.invoker.schema.XmlAttribute;
import io.opencelium.common.invoker.setting.ConnectorSetting;
import org.jspecify.annotations.Nullable;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.SequencedMap;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static io.opencelium.core.invoker.xml.XmlElements.attribute;
import static io.opencelium.core.invoker.xml.XmlElements.build;
import static io.opencelium.core.invoker.xml.XmlElements.child;
import static io.opencelium.core.invoker.xml.XmlElements.children;
import static io.opencelium.core.invoker.xml.XmlElements.text;
import static io.opencelium.core.invoker.xml.XmlElements.textOrNull;

/**
 * Reads a file in the current format.
 *
 * <p>Reading happens in two passes. The file is first validated against {@code invoker-6.0.xsd}, which
 * reports every structural problem with a line and column. Only a structurally valid file is then
 * mapped to the model, whose constructors check the rules the schema cannot express. Problems in one
 * setting or operation do not stop the others from being checked, so a file with several mistakes
 * reports all of them.
 */
final class InvokerV6Reader {

    private final javax.xml.validation.Schema schema;

    InvokerV6Reader(javax.xml.validation.Schema schema) {
        this.schema = schema;
    }

    Invoker read(Document document, byte[] xml) {
        SecureXml.validate(schema, xml);

        Element root = document.getDocumentElement();
        List<InvokerIssue> errors = new ArrayList<>();
        List<ConnectorSetting> settings = collect(children(child(root, "requiredData"), "item"), this::setting, errors);
        List<Operation> operations = collect(children(child(root, "operations"), "operation"), this::operation, errors);
        if (!errors.isEmpty()) {
            throw new InvokerReadException(InvokerFormat.V6, errors);
        }

        try {
            return build(root,
                    () -> new Invoker(
                            attribute(root, "id"),
                            text(child(root, "name").orElseThrow()),
                            optionalText(root, "description"),
                            optionalText(root, "hint"),
                            optionalText(root, "icon"),
                            optionalText(root, "authType"),
                            children(child(root, "category_tags"), "item").stream().map(XmlElements::text).collect(Collectors.toSet()),
                            settings, operations
                    )
            );
        } catch (XmlElements.ElementProblem problem) {
            throw new InvokerReadException(InvokerFormat.V6, List.of(problem.toIssue()));
        }
    }

    private static @Nullable String optionalText(Element parent, String name) {
        return child(parent, name).map(XmlElements::textOrNull).orElse(null);
    }

    // ── settings ─────────────────────────────────────────

    private ConnectorSetting setting(Element item) {
        return build(item, () -> {
            String type = attribute(item, "type");
            String visibility = attribute(item, "visibility");
            String source = attribute(item, "source");
            return new ConnectorSetting(
                    attribute(item, "name"),
                    type == null ? ScalarType.STRING : ScalarType.fromValue(type),
                    visibility == null ? "public" : visibility,
                    textOrNull(item),
                    source);
        });
    }

    // ── operations ───────────────────────────────────────

    private Operation operation(Element element) {
        return build(element, () -> {
            String roles = attribute(element, "roles");
            return new Operation(
                    attribute(element, "operationId"),
                    attribute(element, "name"),
                    attribute(element, "summary"),
                    roles == null ? Set.of() : OperationRole.parseAll(roles),
                    request(child(element, "request").orElseThrow()),
                    children(child(element, "responses"), "response").stream().map(this::response).toList(),
                    child(element, "pagination").map(this::pagination).orElse(null)
            );
        });
    }

    private Request request(Element element) {
        return build(element,
                () -> new Request(
                        text(child(element, "method").orElseThrow()),
                        text(child(element, "endpoint").orElseThrow()),
                        headers(child(element, "header")),
                        children(child(element, "parameters"), "parameter").stream().map(this::parameter).toList(),
                        child(element, "body").map(this::body).orElse(null)
                )
        );
    }

    private List<Header> headers(Optional<Element> header) {
        return children(header, "item").stream()
                .map(item -> build(item, () -> Header.of(attribute(item, "name"), textOrNull(item))))
                .toList();
    }

    private QueryParameter parameter(Element element) {
        return build(element, () -> {
            String style = attribute(element, "style");
            String explode = attribute(element, "explode");
            QueryStyle queryStyle = style == null ? QueryStyle.FORM : QueryStyle.fromValue(style);
            return new QueryParameter(
                    attribute(element, "name"),
                    schemaNode(element),
                    queryStyle,
                    explode == null ? queryStyle == QueryStyle.FORM : "true".equals(explode) || "1".equals(explode));
        });
    }

    private Body body(Element element) {
        return build(element, () -> {
            Optional<Element> schemaElement = child(element, "schema");
            String envelope = attribute(element, "envelope");
            return new Body(
                    ContentType.parse(attribute(element, "contentType")),
                    schemaElement.map(this::schemaNode).orElse(null),
                    envelope,
                    schemaElement.map(this::namespace).orElse(null)
            );
        });
    }

    private @Nullable XmlNamespace namespace(Element schemaElement) {
        String uri = attribute(schemaElement, "targetNamespace");
        String prefix = attribute(schemaElement, "prefix");
        if (uri == null) {
            if (prefix != null) {
                throw new IllegalArgumentException("a prefix needs a targetNamespace to bind to");
            }
            return null;
        }
        return XmlNamespace.of(uri, prefix);
    }

    private Response response(Element element) {
        return build(element,
                () -> new Response(
                        ResponseStatus.parse(attribute(element, "status")),
                        child(element, "condition")
                                .map(condition -> SuccessCondition.of(attribute(condition, "success"))).orElse(null),
                        headers(child(element, "header")),
                        child(element, "body").map(this::body).orElse(null)
                )
        );
    }

    private Pagination pagination(Element element) {
        return build(element, () -> new Pagination(children(element).stream()
                .map(rule -> build(rule, () -> new PageRule(
                        PageParam.fromValue(rule.getLocalName()),
                        PageAction.fromValue(attribute(rule, "action")),
                        textOrNull(rule),
                        attribute(rule, "ref"))))
                .toList()));
    }

    // ── schema ───────────────────────────────────────────

    /**
     * Reads the shape described by an element carrying a {@code type} attribute: a body's schema, a
     * field, an array's items or a query parameter.
     */
    private Schema schemaNode(Element element) {
        String type = attribute(element, "type");
        return build(element, () -> switch (type) {
            case "object" -> {
                allowOnly(element, type, false, "field", "attribute");
                yield new ObjectSchema(
                        children(element, "field").stream()
                                .map(field -> build(field, () -> Field.of(attribute(field, "name"), schemaNode(field))))
                                .toList(),
                        children(element, "attribute").stream().map(this::xmlAttribute).toList());
            }
            case "array" -> {
                allowOnly(element, type, false, "items", "value");
                List<Element> items = children(element, "items");
                if (items.size() != 1) {
                    throw new IllegalArgumentException("an array needs exactly one <items> element describing its "
                            + "elements, but has " + items.size());
                }
                yield new ArraySchema(
                        schemaNode(items.getFirst()),
                        children(element, "value").stream().map(this::value).toList());
            }
            case "undefined" -> {
                allowOnly(element, type, false);
                yield UndefinedSchema.INSTANCE;
            }
            case null -> throw new IllegalArgumentException("the type attribute is missing");
            default -> {
                allowOnly(element, type, true);
                yield new ScalarSchema(ScalarType.fromValue(type), textOrNull(element));
            }
        });
    }

    private XmlAttribute xmlAttribute(Element element) {
        return build(element, () -> XmlAttribute.of(
                attribute(element, "name"),
                new ScalarSchema(ScalarType.fromValue(attribute(element, "type")), textOrNull(element))));
    }

    private Value value(Element element) {
        return build(element, () -> {
            List<Element> fields = children(element, "field");
            List<Element> elements = children(element, "value");
            if (!fields.isEmpty() && !elements.isEmpty()) {
                throw new IllegalArgumentException("a <value> holds either <field> or <value> elements, not both");
            }
            if (!fields.isEmpty() || !elements.isEmpty()) {
                requireNoText(element, "a <value> with child elements");
            }
            if (!fields.isEmpty()) {
                SequencedMap<String, Value> named = new LinkedHashMap<>();
                for (Element field : fields) {
                    String name = attribute(field, "name");
                    if (named.putIfAbsent(name, value(field)) != null) {
                        throw new IllegalArgumentException("value field '" + name + "' is given more than once");
                    }
                }
                return new Value.ObjectValue(named);
            }
            if (!elements.isEmpty()) {
                return new Value.ArrayValue(elements.stream().map(this::value).toList());
            }
            return new Value.TextValue(text(element));
        });
    }

    /**
     * The schema allows every schema element under every node, so which children a node may really
     * have, given its type, is checked here.
     */
    private static void allowOnly(Element element, String type, boolean textAllowed, String... allowed) {
        List<String> permitted = List.of(allowed);
        for (Element child : children(element)) {
            if (!permitted.contains(child.getLocalName())) {
                String expected = permitted.isEmpty()
                        ? "no child elements"
                        : "only " + String.join(", ", permitted.stream().map(name -> "<" + name + ">").toList());
                throw new IllegalArgumentException("a node of type '" + type + "' cannot contain <"
                        + child.getLocalName() + ">; it may contain " + expected);
            }
        }
        if (!textAllowed) {
            requireNoText(element, "a node of type '" + type + "'");
        }
    }

    private static void requireNoText(Element element, String what) {
        if (!text(element).isEmpty()) {
            throw new IllegalArgumentException(what + " cannot also contain text ('" + text(element) + "')");
        }
    }

    private static <T> List<T> collect(List<Element> elements, Function<Element, T> reader, List<InvokerIssue> errors) {
        List<T> result = new ArrayList<>();
        for (Element element : elements) {
            try {
                result.add(reader.apply(element));
            } catch (XmlElements.ElementProblem problem) {
                errors.add(problem.toIssue());
            }
        }
        return result;
    }
}
