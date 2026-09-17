package io.opencelium.common.invoker.operation;

import io.opencelium.common.invoker.pagination.Pagination;
import org.jspecify.annotations.Nullable;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

/**
 * One call an API offers, such as "list tickets" or "create a ticket".
 *
 * <p>Each operation becomes a node type users can place in a workflow.
 *
 * @param id         the permanent identifier; workflows are stored against it
 * @param name       the label users see; safe to change
 * @param summary    one line explaining what the call does, or {@code null}
 * @param roles      special purposes such as testing a connection; usually empty
 * @param request    what the call sends
 * @param responses  what it can return, at least one, with no status declared twice
 * @param pagination how to fetch every page, or {@code null} if results are not paged
 */
public record Operation(
        OperationId id,
        String name,
        @Nullable String summary,
        Set<OperationRole> roles,
        Request request,
        List<Response> responses,
        @Nullable Pagination pagination) {

    public Operation {
        Objects.requireNonNull(id, "operation id must not be null");
        Objects.requireNonNull(name, "name of operation '" + id + "' must not be null");
        Objects.requireNonNull(roles, "roles of operation '" + id + "' must not be null");
        Objects.requireNonNull(request, "request of operation '" + id + "' must not be null");
        Objects.requireNonNull(responses, "responses of operation '" + id + "' must not be null");
        if (name.isBlank()) {
            throw new IllegalArgumentException("name of operation '" + id + "' must not be blank");
        }
        roles = roles.isEmpty() ? Set.of() : Collections.unmodifiableSet(EnumSet.copyOf(roles));
        responses = List.copyOf(responses);
        if (responses.isEmpty()) {
            throw new IllegalArgumentException("operation '" + id + "' must declare at least one response; "
                    + "use status 'default' to accept any");
        }
        Set<ResponseStatus> seen = new HashSet<>();
        for (Response response : responses) {
            if (!seen.add(response.status())) {
                throw new IllegalArgumentException("operation '" + id + "' declares response '"
                        + response.status().value() + "' more than once");
            }
        }
    }

    public boolean hasRole(OperationRole role) {
        return roles.contains(role);
    }

    /**
     * The response that applies to a status code: the most specific match, so an exact code beats
     * its class, and a class beats {@code default}.
     *
     * @return the matching response, or empty if none covers the code
     */
    public Optional<Response> responseFor(int statusCode) {
        return responses.stream()
                .filter(response -> response.status().matches(statusCode))
                .max(Comparator.comparingInt(response -> response.status().specificity()));
    }

    /** Starts an operation with its two required parts; a request and at least one response follow. */
    public static Builder builder(OperationId id, String name) {
        return new Builder(id, name);
    }

    /** Starts an operation, taking its id as text. */
    public static Builder builder(String id, String name) {
        return new Builder(OperationId.of(id), name);
    }

    /**
     * Collects the parts of an operation. {@link #build()} applies every rule of the {@link Operation}
     * constructor.
     */
    public static final class Builder {

        private final OperationId id;
        private final String name;
        private @Nullable String summary;
        private final Set<OperationRole> roles = EnumSet.noneOf(OperationRole.class);
        private @Nullable Request request;
        private final List<Response> responses = new ArrayList<>();
        private @Nullable Pagination pagination;

        private Builder(OperationId id, String name) {
            this.id = id;
            this.name = name;
        }

        public Builder summary(@Nullable String summary) {
            this.summary = summary;
            return this;
        }

        public Builder role(OperationRole role) {
            roles.add(Objects.requireNonNull(role, "role must not be null"));
            return this;
        }

        public Builder roles(Collection<OperationRole> roles) {
            roles.forEach(this::role);
            return this;
        }

        public Builder request(Request request) {
            this.request = request;
            return this;
        }

        /** Sets a request that is still being built. */
        public Builder request(Request.Builder request) {
            return request(request.build());
        }

        public Builder response(Response response) {
            responses.add(Objects.requireNonNull(response, "response must not be null"));
            return this;
        }

        /** Adds a response that is still being built. */
        public Builder response(Response.Builder response) {
            return response(response.build());
        }

        public Builder responses(Collection<Response> responses) {
            responses.forEach(this::response);
            return this;
        }

        public Builder pagination(@Nullable Pagination pagination) {
            this.pagination = pagination;
            return this;
        }

        /**
         * @throws IllegalArgumentException if the parts break a rule of {@link Operation}
         * @throws NullPointerException     if no request was set
         */
        public Operation build() {
            return new Operation(id, name, summary, roles, request, responses, pagination);
        }
    }
}
