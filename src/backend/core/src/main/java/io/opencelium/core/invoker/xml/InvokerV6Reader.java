package io.opencelium.core.invoker.xml;

import io.opencelium.common.invoker.Invoker;
import io.opencelium.common.invoker.schema.ScalarType;
import io.opencelium.common.invoker.setting.ConnectorSetting;
import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import org.jspecify.annotations.Nullable;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import java.util.ArrayList;
import java.util.List;
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
 * mapped to the model, whose constructors check the rules the schema cannot express. A problem in one
 * setting does not stop the others from being checked, so a file with several mistakes reports all of
 * them.
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
                            children(child(root, "category_tags"), "item").stream()
                                    .map(XmlElements::text).collect(Collectors.toSet()),
                            settings
                    )
            );
        } catch (XmlElements.ElementProblem problem) {
            throw new InvokerReadException(InvokerFormat.V6, List.of(problem.toIssue()));
        }
    }

    private static @Nullable String optionalText(Element parent, String name) {
        return child(parent, name).map(XmlElements::textOrNull).orElse(null);
    }

    private ConnectorSetting setting(Element item) {
        return build(item, () -> {
            String type = attribute(item, "type");
            String visibility = attribute(item, "visibility");
            return new ConnectorSetting(
                    attribute(item, "name"),
                    type == null ? ScalarType.STRING : ScalarType.fromValue(type),
                    visibility == null ? "public" : visibility,
                    textOrNull(item),
                    attribute(item, "source"));
        });
    }

    /** Reads every element, collecting the problems instead of stopping at the first. */
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
