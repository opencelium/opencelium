package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerWriter;
import io.opencelium.common.http.Header;
import io.opencelium.common.invoker.Invoker;
import io.opencelium.common.invoker.operation.Body;
import io.opencelium.common.invoker.operation.Operation;
import io.opencelium.common.invoker.operation.OperationRole;
import io.opencelium.common.invoker.operation.QueryParameter;
import io.opencelium.common.invoker.operation.QueryStyle;
import io.opencelium.common.invoker.operation.Request;
import io.opencelium.common.invoker.operation.Response;
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
import io.opencelium.common.invoker.setting.Visibility;
import org.jspecify.annotations.Nullable;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Writes an invoker as a file in the current format.
 *
 * <p>Depend on {@link InvokerWriter} rather than on this class; see it for the contract.
 *
 * <p>The output is canonical: elements appear in schema order, and attributes holding their default
 * value ({@code visibility="public"}, {@code type="string"} on a setting, {@code style="form"}) are left
 * out. Writing is how an upgraded 5.x invoker becomes a v6 file, and how any invoker is exported.
 *
 * <p>Reading what this writer produces gives back an equal invoker, with one exception: an empty
 * object or list used as a default value is written as an empty {@code <value/>}, which reads back
 * as empty text.
 */
public final class XmlInvokerWriter implements InvokerWriter {

    /** The format version written into every file. */
    public static final String FORMAT_VERSION = "6.0";

    @Override
    public byte[] write(Invoker invoker) {
        Objects.requireNonNull(invoker, "invoker must not be null");
        Document document = SecureXml.newDocument();
        Element root = document.createElementNS(null, "invoker");
        root.setAttribute("version", FORMAT_VERSION);
        root.setAttribute("id", invoker.id().value());
        document.appendChild(root);

        textElement(root, "name", invoker.name());
        textElement(root, "description", invoker.description());
        textElement(root, "hint", invoker.hint());
        textElement(root, "icon", invoker.icon());
        if (!invoker.categoryTags().isEmpty()) {
            Element tags = element(root, "category_tags");
            invoker.categoryTags().forEach(tag -> textElement(tags, "item", tag));
        }
        textElement(root, "authType", invoker.authType());
        if (!invoker.settings().isEmpty()) {
            Element requiredData = element(root, "requiredData");
            invoker.settings().forEach(setting -> writeSetting(requiredData, setting));
        }
        Element operations = element(root, "operations");
        invoker.operations().forEach(operation -> writeOperation(operations, operation));

        return SecureXml.serialize(document);
    }


    private static void writeSetting(Element parent, ConnectorSetting setting) {
        Element item = element(parent, "item");
        item.setAttribute("name", setting.name());
        if (setting.type() != ScalarType.STRING) {
            item.setAttribute("type", setting.type().value());
        }
        if (setting.visibility() != Visibility.PUBLIC) {
            item.setAttribute("visibility", setting.visibility().value());
        }
        if (setting.source() != null) {
            item.setAttribute("source", setting.source());
        }
        setText(item, setting.defaultValue());
    }

    private static void writeOperation(Element parent, Operation operation) {
        Element element = element(parent, "operation");
        element.setAttribute("operationId", operation.id().value());
        element.setAttribute("name", operation.name());
        if (operation.summary() != null) {
            element.setAttribute("summary", operation.summary());
        }
        if (!operation.roles().isEmpty()) {
            element.setAttribute("roles",
                    operation.roles().stream().map(OperationRole::value).collect(Collectors.joining(" ")));
        }
        writeRequest(element, operation.request());
        if (operation.pagination() != null) {
            writePagination(element, operation.pagination());
        }
        Element responses = element(element, "responses");
        operation.responses().forEach(response -> writeResponse(responses, response));
    }

    private static void writeRequest(Element parent, Request request) {
        Element element = element(parent, "request");
        textElement(element, "method", request.method().name());
        textElement(element, "endpoint", request.endpoint());
        writeHeaders(element, request.headers());
        if (!request.parameters().isEmpty()) {
            Element parameters = element(element, "parameters");
            request.parameters().forEach(parameter -> writeParameter(parameters, parameter));
        }
        if (request.body() != null) {
            writeBody(element, request.body());
        }
    }

    private static void writeHeaders(Element parent, List<Header> headers) {
        if (headers.isEmpty()) {
            return;
        }
        Element element = element(parent, "header");
        for (Header header : headers) {
            Element item = element(element, "item");
            item.setAttribute("name", header.name());
            setText(item, header.value());
        }
    }

    private static void writeParameter(Element parent, QueryParameter parameter) {
        Element element = element(parent, "parameter");
        element.setAttribute("name", parameter.name());
        writeSchema(element, parameter.schema());
        if (parameter.style() != QueryStyle.FORM) {
            element.setAttribute("style", parameter.style().value());
        }
        boolean defaultExplode = parameter.style() == QueryStyle.FORM;
        if (parameter.explode() != defaultExplode) {
            element.setAttribute("explode", String.valueOf(parameter.explode()));
        }
    }

    private static void writeBody(Element parent, Body body) {
        Element element = element(parent, "body");
        element.setAttribute("contentType", body.contentType().toString());
        if (body.envelope() != null) {
            element.setAttribute("envelope", body.envelope().value());
        }
        if (body.schema() != null) {
            Element schema = element(element, "schema");
            writeSchema(schema, body.schema());
            if (body.xmlNamespace() != null) {
                schema.setAttribute("targetNamespace", body.xmlNamespace().uri());
                if (body.xmlNamespace().prefix() != null) {
                    schema.setAttribute("prefix", body.xmlNamespace().prefix());
                }
            }
        }
    }

    private static void writeResponse(Element parent, Response response) {
        Element element = element(parent, "response");
        element.setAttribute("status", response.status().value());
        if (response.condition() != null) {
            element(element, "condition").setAttribute("success", response.condition().expression());
        }
        writeHeaders(element, response.headers());
        if (response.body() != null) {
            writeBody(element, response.body());
        }
    }

    private static void writePagination(Element parent, Pagination pagination) {
        Element element = element(parent, "pagination");
        for (PageRule rule : pagination.rules()) {
            Element ruleElement = element(element, rule.param().value());
            ruleElement.setAttribute("action", rule.action().value());
            if (rule.ref() != null) {
                ruleElement.setAttribute("ref", rule.ref());
            }
            setText(ruleElement, rule.value());
        }
    }

    /** Writes a shape onto an element that already exists: its type attribute and its content. */
    private static void writeSchema(Element target, Schema schema) {
        target.setAttribute("type", schema.typeName());
        switch (schema) {
            case ObjectSchema object -> {
                for (Field field : object.fields()) {
                    Element element = element(target, "field");
                    element.setAttribute("name", field.name());
                    writeSchema(element, field.schema());
                }
                for (XmlAttribute attribute : object.attributes()) {
                    Element element = element(target, "attribute");
                    element.setAttribute("name", attribute.name());
                    element.setAttribute("type", attribute.schema().type().value());
                    setText(element, attribute.schema().defaultValue());
                }
            }
            case ArraySchema array -> {
                writeSchema(element(target, "items"), array.items());
                array.defaults().forEach(value -> writeValue(element(target, "value"), value));
            }
            case ScalarSchema scalar -> setText(target, scalar.defaultValue());
            case UndefinedSchema undefined -> {
            }
        }
    }

    private static void writeValue(Element target, Value value) {
        switch (value) {
            case Value.TextValue text -> setText(target, text.text());
            case Value.ObjectValue object -> object.fields().forEach((name, fieldValue) -> {
                Element field = element(target, "field");
                field.setAttribute("name", name);
                writeValue(field, fieldValue);
            });
            case Value.ArrayValue array -> array.elements().forEach(element -> writeValue(element(target, "value"), element));
        }
    }

    private static Element element(Element parent, String name) {
        Element child = parent.getOwnerDocument().createElementNS(null, name);
        parent.appendChild(child);
        return child;
    }

    private static void textElement(Element parent, String name, @Nullable String text) {
        if (text != null) {
            element(parent, name).setTextContent(text);
        }
    }

    private static void setText(Element element, @Nullable String text) {
        if (text != null && !text.isEmpty()) {
            element.setTextContent(text);
        }
    }
}
