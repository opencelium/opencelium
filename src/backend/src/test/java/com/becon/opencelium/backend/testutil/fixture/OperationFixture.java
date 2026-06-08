/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.testutil.fake.FakeReferenceExtractor;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE;

/**
 * Object mother for {@link Operation} test data.
 */
public final class OperationFixture {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String RESOURCE = "/fake/response-entity-body-reference-extractor.json";
    private static final Map<String, Object> body;

    static {
        try (InputStream is = FakeReferenceExtractor.class.getResourceAsStream(RESOURCE)) {
            body = MAPPER.readValue(is, new TypeReference<>() {});
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load test fixture: " + RESOURCE, e);
        }
    }

    private OperationFixture() {
    }

    public static Operation anOperationWithResponseBody() {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_TYPE, APPLICATION_JSON_VALUE);
        headers.put("X-Empty", List.of());
        headers.add("Set-Cookie", "expires=Mon, 17-Jul-2017 16:06:00 GMT; Max-Age=31449600; Path=/; secure");
        headers.put("Vary", List.of("Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));

        ResponseEntity<?> response = new ResponseEntity<>(body, headers, HttpStatus.OK);

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(0);

        operation.getResponses().put("#", response);

        return operation;
    }

    public static Operation anOperationWithErrorResponseBody(String message) {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_TYPE, APPLICATION_JSON_VALUE);

        ResponseEntity<?> response = new ResponseEntity<>(message, headers, HttpStatus.NOT_FOUND);

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(0);

        operation.getResponses().put("#", response);

        return operation;
    }

    public static Operation anOperationInDoubleLoop() {
        String body = "{\"index\": \"%s\"}";

        ResponseEntity<?> res00 = response(200, header("index", "0_0"), body.formatted("0_0"));
        ResponseEntity<?> res01 = response(201, header("index", "0_1"), body.formatted("0_1"));
        ResponseEntity<?> res02 = response(202, header("index", "0_2"), body.formatted("0_2"));
        ResponseEntity<?> res10 = response(300, header("index", "1_0"), body.formatted("1_0"));
        ResponseEntity<?> res11 = response(301, header("index", "1_1"), body.formatted("1_1"));
        ResponseEntity<?> res12 = response(302, header("index", "1_2"), body.formatted("1_2"));

        Map<String, ResponseEntity<?>> responses = Map.of(
                "0, 0", res00, "1, 1", res11, "1, 0", res10,
                "0, 2", res02, "0, 1", res01, "1, 2", res12
        );

        return operation("#ababab", 2, responses);
    }


    private static HttpHeaders header(String key, String value) {
        var headers = new HttpHeaders();
        headers.add(key, value);

        return headers;
    }

    private static ResponseEntity<?> response(int status, HttpHeaders headers, Object body) {
        return new ResponseEntity<>(body, headers, HttpStatus.valueOf(status));
    }

    private static Operation operation(String color, int loopDepth, Map<String, ResponseEntity<?>> responses) {
        Operation operation = new Operation();
        operation.setColor(color);
        operation.setLoopDepth(loopDepth);

        operation.getResponses().putAll(responses);

        return operation;
    }
}
