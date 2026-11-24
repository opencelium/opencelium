package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.reference.ReferenceMatchers;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Resolves references from static values given by the user, and connector data and global
 * variables from where they are kept.
 *
 * <p>Used by the single-method test, where no other method, webhook call or script runs:
 *
 * <ul>
 *   <li>a reference with a static value always resolves to that value, even a request data or a
 *       global variable reference, so a connector field or a variable can be overridden;
 *   <li>a request data reference ({@code {key}}, {@code {#ctorId.key}}) without one is read from
 *       the connector by {@code delegate};
 *   <li>a global variable reference ({@code {{global.name}}}) without one is read by {@code
 *       delegate} from the snapshot of the test, which fails for a variable it does not hold.
 *       Which variables the test may read, and which references it can resolve at all, is
 *       decided before the request is built;
 *   <li>any other reference without one is an error: its data is never produced in a test.
 * </ul>
 */
public final class StaticValueExtractor implements Extractor {

    private final Map<String, Object> staticValues;
    private final Extractor delegate;

    /**
     * Creates an extractor that answers from {@code staticValues} first, then from {@code delegate}
     * for request data and global variable references.
     *
     * @param staticValues values keyed by the exact reference text; {@code null} values are allowed
     * @param delegate extractor that reads request data references from the connectors and global
     *     variable references from the snapshot of the test
     */
    public StaticValueExtractor(Map<String, Object> staticValues, Extractor delegate) {
        this.staticValues = Collections.unmodifiableMap(new HashMap<>(staticValues));
        this.delegate = Objects.requireNonNull(delegate, "delegate");
    }

    /**
     * Returns the value of {@code reference}.
     *
     * @throws IllegalStateException if {@code reference} has no static value and is neither a
     *     request data nor a global variable reference
     */
    @Override
    public Object extractValue(String reference) {
        if (reference == null) {
            return null;
        }

        if (staticValues.containsKey(reference)) {
            return staticValues.get(reference);
        }

        if (ReferenceMatchers.isGlobal(reference) || ReferenceMatchers.isRequestData(reference)) {
            return delegate.extractValue(reference);
        }

        throw new IllegalStateException(
                "No static value is given for reference '%s'.".formatted(reference));
    }
}
