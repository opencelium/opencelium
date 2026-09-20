package io.opencelium.common.invoker.operation;

import java.util.Objects;
import java.util.regex.Pattern;

/**
 * The XML namespace of a generated payload.
 *
 * <p>This is the namespace of the document OpenCelium <em>sends or receives</em>, not of the invoker
 * file describing it, which is why an invoker file calls it {@code targetNamespace}, the same
 * distinction XML Schema draws:
 * <pre>{@code
 * <schema type="object" targetNamespace="http://acme.com/servicedesk/v1" prefix="sd">
 * }</pre>
 *
 * @param uri    the namespace name; an identifier that does not need to resolve to anything
 * @param prefix the prefix to bind it to, or {@code null} to make it the default namespace
 */
public record XmlNamespace(String uri, String prefix) {

    /** A prefix is an XML non-colonized name. */
    private static final Pattern NCNAME = Pattern.compile("[A-Za-z_][\\w.\\-]*");

    public XmlNamespace {
        Objects.requireNonNull(uri, "namespace uri must not be null");
        if (uri.isBlank()) {
            throw new IllegalArgumentException("namespace uri must not be blank");
        }
        if (prefix != null && !NCNAME.matcher(prefix).matches()) {
            throw new IllegalArgumentException("'" + prefix + "' is not a valid namespace prefix");
        }
    }

    public static XmlNamespace of(String uri, String prefix) {
        return new XmlNamespace(uri, prefix);
    }
}
