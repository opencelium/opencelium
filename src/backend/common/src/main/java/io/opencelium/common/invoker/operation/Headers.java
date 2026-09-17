package io.opencelium.common.invoker.operation;

import io.opencelium.common.http.Header;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

/** Header rules shared by requests and responses. */
final class Headers {

    private Headers() {
    }

    /**
     * An immutable copy of the headers, rejecting {@code Content-Type}: the media type belongs to
     * {@link Body#contentType()}, and stating it twice would allow the two to disagree.
     */
    static List<Header> copyOf(List<Header> headers, String owner) {
        Objects.requireNonNull(headers, owner + " headers must not be null");
        List<Header> copy = List.copyOf(headers);
        for (Header header : copy) {
            if (header.hasName(Header.CONTENT_TYPE)) {
                throw new IllegalArgumentException(owner + " declares a Content-Type header; "
                        + "state the media type as the body's contentType instead");
            }
        }
        return copy;
    }

    /** The first header with this name, compared without regard to case. */
    static Optional<Header> find(List<Header> headers, String name) {
        return headers.stream().filter(header -> header.hasName(name)).findFirst();
    }
}
