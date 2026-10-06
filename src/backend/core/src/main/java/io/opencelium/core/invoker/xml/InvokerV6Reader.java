package io.opencelium.core.invoker.xml;

import io.opencelium.common.invoker.Invoker;
import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.InvokerReadException;
import org.jspecify.annotations.Nullable;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import java.util.List;
import java.util.stream.Collectors;

import static io.opencelium.core.invoker.xml.XmlElements.attribute;
import static io.opencelium.core.invoker.xml.XmlElements.build;
import static io.opencelium.core.invoker.xml.XmlElements.child;
import static io.opencelium.core.invoker.xml.XmlElements.children;
import static io.opencelium.core.invoker.xml.XmlElements.text;

/**
 * Reads a file in the current format.
 *
 * <p>Reading happens in two passes. The file is first validated against {@code invoker-6.0.xsd}, which
 * reports every structural problem with a line and column. Only a structurally valid file is then
 * mapped to the model, whose constructors check the rules the schema cannot express.
 */
final class InvokerV6Reader {

    private final javax.xml.validation.Schema schema;

    InvokerV6Reader(javax.xml.validation.Schema schema) {
        this.schema = schema;
    }

    Invoker read(Document document, byte[] xml) {
        SecureXml.validate(schema, xml);

        Element root = document.getDocumentElement();
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
                                    .map(XmlElements::text).collect(Collectors.toSet())
                    )
            );
        } catch (XmlElements.ElementProblem problem) {
            throw new InvokerReadException(InvokerFormat.V6, List.of(problem.toIssue()));
        }
    }

    private static @Nullable String optionalText(Element parent, String name) {
        return child(parent, name).map(XmlElements::textOrNull).orElse(null);
    }
}
