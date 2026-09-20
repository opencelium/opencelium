package io.opencelium.common.invoker.operation;

import io.opencelium.common.http.Header;

import java.util.List;
import java.util.Optional;

/** Header rules shared by requests and responses. */
final class Headers {

    private Headers() {
    }

    /** The first header with this name, compared without regard to case. */
    static Optional<Header> find(List<Header> headers, String name) {
        return headers.stream().filter(header -> header.hasName(name)).findFirst();
    }
}
