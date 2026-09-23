package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerFormat;
import org.w3c.dom.Document;

import java.util.Objects;

/**
 * An invoker file that was parsed and recognised, before anything is made of its contents.
 *
 * @param format   the format generation the file was written in
 * @param document the parsed file, namespace-aware and without comments
 */
public record InvokerDocument(InvokerFormat format, Document document) {

    public InvokerDocument {
        Objects.requireNonNull(format, "format must not be null");
        Objects.requireNonNull(document, "document must not be null");
    }

    /** Whether the file was written in a format older than the current one. */
    public boolean legacy() {
        return format != InvokerFormat.V6;
    }
}
