package io.opencelium.common.invoker.operation;

import io.opencelium.common.invoker.pagination.Pagination;

import java.util.Collections;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
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
        String id,
        String name,
        String summary,
        Set<OperationRole> roles,
        Request request,
        List<Response> responses,
        Pagination pagination) {

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
}
