package com.becon.opencelium.backend.constant;

public interface ConnectionConstants {
    String DEFAULT_CONNECTOR_NAME = "DEFAULT";
    String DEFAULT_INVOKER_NAME = "DEFAULT";
    Integer DEFAULT_CONNECTOR_ID = -1;

    /** The {@code data} of a request body that holds a GraphQL request. */
    String GRAPHQL_BODY_DATA = "graphql";

    /** The field of a GraphQL request body that holds the query text. */
    String GRAPHQL_QUERY_FIELD = "query";

    /** The field of a GraphQL request body that names the operation to run. */
    String GRAPHQL_OPERATION_NAME_FIELD = "operationName";
}
