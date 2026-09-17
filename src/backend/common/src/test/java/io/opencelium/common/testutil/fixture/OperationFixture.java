package io.opencelium.common.testutil.fixture;

import io.opencelium.common.http.ContentType;
import io.opencelium.common.http.HttpMethod;
import io.opencelium.common.invoker.operation.Body;
import io.opencelium.common.invoker.operation.Operation;
import io.opencelium.common.invoker.operation.OperationRole;
import io.opencelium.common.invoker.operation.Request;
import io.opencelium.common.invoker.operation.Response;
import io.opencelium.common.invoker.operation.ResponseStatus;
import io.opencelium.common.invoker.schema.Field;
import io.opencelium.common.invoker.schema.Schema;

import java.util.List;

/** Operations and responses for tests. */
public final class OperationFixture {

    private OperationFixture() {
    }

    /** A minimal valid operation: {@code GET {url}/<id>} answering with a default response. */
    public static Operation anOperation(String id, OperationRole... roles) {
        return Operation.builder(id, id)
                .roles(List.of(roles))
                .request(Request.of(HttpMethod.GET, "{url}/" + id))
                .response(Response.of(ResponseStatus.DEFAULT))
                .build();
    }

    /** An operation whose only difference from {@link #anOperation} is its responses. */
    public static Operation anOperationWithResponses(Response... responses) {
        return Operation.builder("op", "op")
                .request(Request.of(HttpMethod.GET, "{url}/op"))
                .responses(List.of(responses))
                .build();
    }

    /** A response with a JSON body holding a single {@code message} field. */
    public static Response aJsonResponse(ResponseStatus status) {
        return Response.of(status, Body.of(ContentType.APPLICATION_JSON,
                Schema.object(Field.of("message", Schema.string()))));
    }
}
