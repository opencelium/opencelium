package com.becon.opencelium.backend.resource.connection.referencevalidation;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Body of {@code POST /connection/reference/validate}.
 *
 * @param reference the reference exactly as it will be stored, e.g. {@code
 *     #ababab.(response).body.$.data[*].id} or {@code ${order.id:integer}}
 * @param iterators the loop iterators visible where the reference is used, e.g. {@code ["i",
 *     "j"]}; {@code null} when unknown, which skips the iterator check, an empty list when the
 *     reference is not inside a loop
 * @param sample an optional example of the JSON the path is read from (the method's example
 *     response or request body, or the webhook variables), as a JSON value or as a JSON string;
 *     when given, the path is also looked up in it
 */
public record ReferenceValidationRequestDTO(String reference, List<String> iterators, Object sample) {

    public ReferenceValidationRequestDTO {
        iterators = iterators == null
                ? null
                : iterators.stream().filter(Objects::nonNull).toList();
    }

    /** The iterators in scope, empty when the caller did not say. */
    public Optional<List<String>> iteratorsInScope() {
        return Optional.ofNullable(iterators);
    }
}
