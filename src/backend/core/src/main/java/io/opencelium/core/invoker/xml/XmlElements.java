package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerIssue;
import org.jspecify.annotations.Nullable;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

/**
 * Small DOM helpers shared by the readers.
 *
 * <p>Elements are matched by local name. Invoker files of every generation use no namespace.
 */
final class XmlElements {

    private XmlElements() {
    }

    /** Every child element, in document order. */
    static List<Element> children(Element parent) {
        List<Element> result = new ArrayList<>();
        NodeList nodes = parent.getChildNodes();
        for (int i = 0; i < nodes.getLength(); i++) {
            if (nodes.item(i) instanceof Element element) {
                result.add(element);
            }
        }
        return result;
    }

    /** The child elements with a local name, in document order. */
    static List<Element> children(Element parent, String name) {
        return children(parent).stream().filter(child -> name.equals(child.getLocalName())).toList();
    }

    /** The children of an optional element; empty if the element is absent. */
    static List<Element> children(Optional<Element> parent, String name) {
        return parent.map(element -> children(element, name)).orElse(List.of());
    }

    /** The first child element with a local name. */
    static Optional<Element> child(Element parent, String name) {
        return children(parent, name).stream().findFirst();
    }

    /**
     * The element's own text, trimmed, ignoring the text of its children. Empty if it has none.
     *
     * <p>This differs from {@link Node#getTextContent()}, which also collects every descendant's text.
     */
    static String text(Element element) {
        StringBuilder text = new StringBuilder();
        NodeList nodes = element.getChildNodes();
        for (int i = 0; i < nodes.getLength(); i++) {
            Node node = nodes.item(i);
            if (node.getNodeType() == Node.TEXT_NODE || node.getNodeType() == Node.CDATA_SECTION_NODE) {
                text.append(node.getNodeValue());
            }
        }
        return text.toString().trim();
    }

    /** The element's own text, trimmed, or {@code null} if it has none. */
    static @Nullable String textOrNull(Element element) {
        String text = text(element);
        return text.isEmpty() ? null : text;
    }

    /** An attribute's value, or {@code null} if the attribute is absent. */
    static @Nullable String attribute(Element element, String name) {
        return element.hasAttribute(name) ? element.getAttribute(name) : null;
    }

    /**
     * A readable path to an element, such as
     * {@code /invoker/operations/operation[@operationId='login']/request/body}. Elements are identified
     * by their {@code operationId} or {@code name} where they have one, and by position otherwise.
     */
    static String location(Element element) {
        List<String> segments = new ArrayList<>();
        for (Node node = element; node instanceof Element current; node = node.getParentNode()) {
            segments.addFirst(segment(current));
        }
        return "/" + String.join("/", segments);
    }

    /**
     * Runs a model constructor, reporting any rule it rejects against the element being read. Problems
     * already located deeper in the tree pass through unchanged, so the most precise location wins.
     */
    static <T> T build(Element element, Supplier<T> construction) {
        try {
            return construction.get();
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new ElementProblem(location(element), e.getMessage() == null ? e.toString() : e.getMessage());
        }
    }

    private static String segment(Element element) {
        String name = element.getLocalName() == null ? element.getNodeName() : element.getLocalName();
        for (String key : List.of("operationId", "name")) {
            String value = attribute(element, key);
            if (value != null) {
                return name + "[@" + key + "='" + value + "']";
            }
        }
        if (element.getParentNode() instanceof Element parent) {
            List<Element> siblings = children(parent, name);
            if (siblings.size() > 1) {
                return name + "[" + (siblings.indexOf(element) + 1) + "]";
            }
        }
        return name;
    }

    /** A rule violation already tied to the element it was found in. */
    static final class ElementProblem extends RuntimeException {

        private final String location;

        ElementProblem(String location, String message) {
            super(message);
            this.location = location;
        }

        String location() {
            return location;
        }

        InvokerIssue toIssue() {
            return InvokerIssue.error(location, getMessage());
        }
    }
}
