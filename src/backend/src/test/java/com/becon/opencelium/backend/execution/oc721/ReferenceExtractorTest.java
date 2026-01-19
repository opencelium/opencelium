package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.execution.ExecutionManager;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReferenceExtractorTest {

    private ExecutionManager executionManager;
    private ReferenceExtractor extractor;

    /*
     * Test-only delegate for ReferenceExtractor.extractValue(..).
     * Used to reduce noise in "find usages" results from test code.
     */
    private Object extractValue(String rawReference) {
        return extractor.extractValue(rawReference);
    }


    @BeforeEach
    void setUp() {
        executionManager = mock(ExecutionManager.class);
        extractor = new ReferenceExtractor(executionManager);
    }

    // =======================================================
    //                    DIRECT_REFERENCE
    // =======================================================

    // CASE 1: collect all data from Operation, there are 4 sub-cases
    // CASE 1.1: '#ababab.(response).[*]'
    // CASE 1.2: '#ababab.(response).[*].status'
    // CASE 1.3: '#ababab.(response).[*].header'
    // CASE 1.4: '#ababab.(response).[*].body'

    @Test
    void extractAllResponses_case1_1() {
        // GIVEN
        ResponseEntity<?> res00 = response(200, "index_path: 0_0");
        ResponseEntity<?> res01 = response(200, "index_path: 0_1");
        ResponseEntity<?> res02 = response(200, "index_path: 0_2");
        ResponseEntity<?> res10 = response(200, "index_path: 1_0");
        ResponseEntity<?> res11 = response(200, "index_path: 1_1");
        ResponseEntity<?> res12 = response(200, "index_path: 1_2");

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(2);

        Map<String, ResponseEntity<?>> responses = Map.of(
                "0, 0", res00, "1, 1", res11, "1, 0", res10,
                "0, 2", res02, "0, 1", res01, "1, 2", res12
        );
        operation.getResponses().putAll(responses);

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));


        // WHEN
        Object result = extractValue("#ababab.(response).[*]");


        // THEN
        assertTrue(result instanceof TreeMap);
        TreeMap<String, ?> responseAll = (TreeMap<String, ?>) result;

        assertEquals(
                List.of("0, 0", "0, 1", "0, 2", "1, 0", "1, 1", "1, 2"),
                new ArrayList<>(responseAll.keySet())
        );
    }

    @Test
    void extractAllResponseStatuses_case1_2() {
        // GIVEN
        ResponseEntity<?> res00 = response(200, "index_path: 0_0");
        ResponseEntity<?> res01 = response(201, "index_path: 0_1");
        ResponseEntity<?> res02 = response(202, "index_path: 0_2");
        ResponseEntity<?> res10 = response(301, "index_path: 1_0");
        ResponseEntity<?> res11 = response(302, "index_path: 1_1");
        ResponseEntity<?> res12 = response(303, "index_path: 1_2");

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(2);

        Map<String, ResponseEntity<?>> responses = Map.of(
                "0, 0", res00, "1, 1", res11, "1, 0", res10,
                "0, 2", res02, "0, 1", res01, "1, 2", res12
        );
        operation.getResponses().putAll(responses);

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));


        // WHEN
        Object result = extractValue("#ababab.(response).[*].status");


        // THEN
        assertTrue(result instanceof TreeMap);
        TreeMap<String, Integer> responseStatuses = (TreeMap<String, Integer>) result;

        assertEquals(
                List.of("0, 0", "0, 1", "0, 2", "1, 0", "1, 1", "1, 2"),
                new ArrayList<>(responseStatuses.keySet())
        );

        assertEquals(
                List.of(200, 201, 202, 301, 302, 303),
                new ArrayList<>(responseStatuses.values())
        );
    }

    @Test
    void extractAllResponseHeaders_case1_3() {
        // GIVEN
        ResponseEntity<?> res00 = response(200, "index_path: 0_0", "index", "0_0");
        ResponseEntity<?> res01 = response(200, "index_path: 0_1", "index", "0_1");
        ResponseEntity<?> res02 = response(200, "index_path: 0_2", "index", "0_2");
        ResponseEntity<?> res10 = response(200, "index_path: 1_0", "index", "1_0");
        ResponseEntity<?> res11 = response(200, "index_path: 1_1", "index", "1_1");
        ResponseEntity<?> res12 = response(200, "index_path: 1_2", "index", "1_2");

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(2);

        Map<String, ResponseEntity<?>> responses = Map.of(
                "0, 0", res00, "1, 1", res11, "1, 0", res10,
                "0, 2", res02, "0, 1", res01, "1, 2", res12
        );
        operation.getResponses().putAll(responses);

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));


        // WHEN
        Object result = extractValue("#ababab.(response).[*].header");


        // THEN
        assertTrue(result instanceof TreeMap);
        TreeMap<String, Map<String, List<String>>> responseHeaders = (TreeMap<String, Map<String, List<String>>>) result;

        assertEquals(
                List.of("0, 0", "0, 1", "0, 2", "1, 0", "1, 1", "1, 2"),
                new ArrayList<>(responseHeaders.keySet())
        );

        responseHeaders.forEach((key, headers) ->
                assertEquals(
                        List.of(key.replace(", ", "_")),
                        headers.get("index")
                )
        );
    }

    @Test
    void extractAllResponseBodies_case1_4() {
        // GIVEN
        ResponseEntity<?> res00 = response(200, "index_path: 0_0");
        ResponseEntity<?> res01 = response(200, "index_path: 0_1");
        ResponseEntity<?> res02 = response(200, "index_path: 0_2");
        ResponseEntity<?> res10 = response(200, "index_path: 1_0");
        ResponseEntity<?> res11 = response(200, "index_path: 1_1");
        ResponseEntity<?> res12 = response(200, "index_path: 1_2");

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(2);

        Map<String, ResponseEntity<?>> responses = Map.of(
                "0, 0", res00, "1, 1", res11, "1, 0", res10,
                "0, 2", res02, "0, 1", res01, "1, 2", res12
        );
        operation.getResponses().putAll(responses);

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));


        // WHEN
        Object result = extractValue("#ababab.(response).[*].body");


        // THEN
        assertTrue(result instanceof TreeMap);
        TreeMap<String, Object> responseBodies = (TreeMap<String, Object>) result;

        assertEquals(
                List.of("0, 0", "0, 1", "0, 2", "1, 0", "1, 1", "1, 2"),
                new ArrayList<>(responseBodies.keySet())
        );

        assertEquals(
                List.of("index_path: 0_0", "index_path: 0_1", "index_path: 0_2", "index_path: 1_0", "index_path: 1_1", "index_path: 1_2"),
                new ArrayList<>(responseBodies.values())
        );
    }


    // CASE 2: return 'status' code of ResponseEntity, there is one sub-case
    // CASE 2.1: '#ababab.(response).status',

    @Test
    void extractResponseStatus_case2_1() {
        // GIVEN
        ResponseEntity<?> res00 = response(200, "index_path: 0_0");
        ResponseEntity<?> res01 = response(201, "index_path: 0_1");
        ResponseEntity<?> res10 = response(300, "index_path: 1_0");
        ResponseEntity<?> res11 = response(301, "index_path: 1_1"); // should verufy this for key = "1, 1"

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(2);

        Map<String, ResponseEntity<?>> responses = Map.of(
                "0, 0", res00, "1, 1", res11,
                "1, 0", res10, "0, 1", res01
        );
        operation.getResponses().putAll(responses);

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(2))
                .thenReturn("1, 1");


        // WHEN
        Object status = extractValue("#ababab.(response).status");


        // THEN
        assertEquals(301, status);
    }


    // CASE 3: return 'header' value of HttpEntity, there are 2 sub-cases
    // CASE 3.1: '#ababab.(response).header.$.Content-Type',
    // CASE 3.2: '#ababab.(request).header.$.Content-Type',

    @Test
    void extractResponseHeaderValue_case3_1() {
        // GIVEN
        ResponseEntity<?> response = response(200, "{body: \"value\"}", "headerKey", "headerValue");

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(0);

        operation.getResponses().put("#", response);

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");


        // WHEN
        Object result = extractValue("#ababab.(response).header.$.headerKey");


        // THEN
        assertEquals(List.of("headerValue"), result);
    }

    @Test
    void extractRequestHeaderValue_case3_2() {
        // GIVEN
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Req", "123");

        RequestEntity<String> request =
                new RequestEntity<>("{}", headers, HttpMethod.POST, URI.create("http://example.com"));

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(0);

        operation.addRequest("#", request);

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");


        // WHEN
        Object result = extractValue("#ababab.(request).header.$.X-Req");


        // THEN
        assertEquals(List.of("123"), result);
    }

    // CASE 4: extract data from HttpEntity, there are 4 sub-cases
    // CASE 4.1: FOR_IN operator, there are 2 sub-cases
    //   CASE 4.1.1: index types for KEY(s), there are 3 sub-cases:
    //      CASE 4.1.1.1: obj['i']~            - field name on ith index (indexing starts from 0)
    //      CASE 4.1.1.2: obj['*']~            - all field names
    //      CASE 4.1.1.3: obj['field_name']~   - field_name by this fields' name
    //   CASE 4.1.2: index types for VALUE(s), there are 2 sub-cases:
    //      CASE 4.1.2.1: obj['i']             - value of the field on ith index (indexing starts from 0)
    //      CASE 4.1.2.2: obj['field_name']    - value of the field by its name
    //
    // CASE 4.2: SPLIT STRING operator, there are 3 sub-cases
    //   CASE 4.2.1: field[i]~            - string on the ith index (indexing starts from 0)
    //   CASE 4.2.2: field[*]~            - all strings (after splitting)
    //   CASE 4.2.3: field[2]~            - string on the 2nd index (indexing starts from 0)
    //
    // CASE 4.3: FOR operator, there are 3 cases (2 of them is handled in CASE 4.4)
    //   CASE 4.3.1: array[i]             - value on the ith index (indexing starts from 0)
    //   CASE 4.3.2: array[3]             - value on the 3rd index (indexing starts from 0) (handled in CASE 4.4)
    //   CASE 4.3.3: array[*]             - all values (handled in CASE 4.4)
    //
    // CASE 4.4: regular json path

    private static final String jsonResponseBody = """
            {
              "status": "ok",
              "meta": {
                "response-id": "142",
                "version": 3
              },
              "data": {
                "items": [
                  {
                    "id": 1,
                    "name": "first",
                    "tags": ["a", "b", "c"],
                    "metrics": {
                      "count": 10,
                      "ratio": 0.5
                    }
                  },
                  {
                    "id": 2,
                    "name": "second",
                    "tags": ["x", "y"],
                    "metrics": {
                      "count": 20,
                      "ratio": 1.5
                    }
                  }
                ],
                "map_with_special_keys": {
                  "key.with.dot": {
                    "inner-value": 42
                  }
                }
              },
              "list": [
                "L1",
                "L2",
                "L3"
              ],
              "string_with_delimiter": "a;b;c;d"
            }""";


    @Test
    void extractFromJsonResponseBody_FOIR_IN_case4_1_1_1() {
        // GIVEN
        ResponseEntity<?> response = response(
                200,
                jsonResponseBody,
                HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE
        );

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(0);

        operation.getResponses().put("#", response);

        OperatorEx operator = new OperatorEx();
        operator.setIndex("0");
        operator.setType("forin");
        operator.setIterator("i");
        operator.setExpression("forin {%#ababab.(response).body.$.meta['*']~%}");
        Loop loop = Loop.fromOperator(operator);
        loop.setValue("version");
        loop.setIndex(1);

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        when(executionManager.getLoops())
                .thenReturn(List.of(loop));


        // WHEN
        Object val1 = extractValue("#ababab.(response).body.$.meta['i']~");


        // THEN
        assertEquals("version", val1);
    }

    @Test
    void extractFromJsonResponseBody_FOIR_IN_case4_1_1_2() {
        // GIVEN
        ResponseEntity<?> response = response(
                200,
                jsonResponseBody,
                HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE
        );

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(0);

        operation.getResponses().put("#", response);

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");


        // WHEN
        Object val = extractValue("#ababab.(response).body.$.meta['*']~");


        // THEN
        assertEquals(List.of("response-id", "version"), val);
    }

    @Test
    void extractFromJsonResponseBody_FOIR_IN_case4_1_1_3() {
        // GIVEN
        ResponseEntity<?> response = response(
                200,
                jsonResponseBody,
                HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE
        );

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(0);

        operation.getResponses().put("#", response);

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");


        // WHEN
        Object val1 = extractValue("#ababab.(response).body.$.meta['response-id']~");


        // THEN
        assertEquals("response-id", val1);
    }

    @Test
    void extractFromJsonResponseBody_FOIR_IN_case4_1_2_1() {
        // GIVEN
        ResponseEntity<?> response = response(
                200,
                jsonResponseBody,
                HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE
        );

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(0);

        operation.getResponses().put("#", response);

        OperatorEx operator = new OperatorEx();
        operator.setIndex("0");
        operator.setType("forin");
        operator.setIterator("i");
        operator.setExpression("forin {%#ababab.(response).body.$.data.items[0]['*']~%}");
        Loop loop = Loop.fromOperator(operator);

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        when(executionManager.getLoops())
                .thenReturn(List.of(loop));


        // WHEN-THEN
        loop.setValue("name");
        loop.setIndex(1);

        Object val1 = extractValue("#ababab.(response).body.$.data.items[0]['i']");
        assertEquals("first", val1);


        loop.setValue("metrics");
        loop.setIndex(3);
        Object val2 = extractValue("#ababab.(response).body.$.data.items[0]['i']");
        assertTrue(val2 instanceof Map);
        Map metrics = (Map) val2;
        assertEquals(metrics.get("count"), 10);
        assertEquals(metrics.get("ratio"), 0.5);
    }

    @Test
    void extractFromJsonResponseBody_FOIR_IN_case4_1_2_2() {
        // GIVEN
        ResponseEntity<?> response = response(
                200,
                jsonResponseBody,
                HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE
        );

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(0);

        operation.getResponses().put("#", response);

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");


        // WHEN
        Object val = extractValue("#ababab.(response).body.$.data['map_with_special_keys']");


        // THEN
        assertTrue(val instanceof Map);
        Map mapWithSpecialKeys = (Map) val;
        assertTrue(mapWithSpecialKeys.containsKey("key.with.dot"));

        assertTrue(mapWithSpecialKeys.get("key.with.dot") instanceof Map);
        Map keyWithDot = (Map) mapWithSpecialKeys.get("key.with.dot");
        assertTrue(keyWithDot.containsKey("inner-value"));
        assertEquals(1, keyWithDot.size());
        assertEquals(42, keyWithDot.get("inner-value"));
    }

    @Test
    void extractFromJsonResponseBody_SPLIT_STRING_case4_2_1() {
        // GIVEN
        ResponseEntity<?> response = response(
                200,
                jsonResponseBody,
                HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE
        );

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(0);

        operation.getResponses().put("#", response);

        OperatorEx operator = new OperatorEx();
        operator.setIndex("0");
        operator.setType("SplitString");
        operator.setIterator("i");
        operator.setExpression("{%#ababab.(response).body.$.string_with_delimiter[*]~%} SplitString ';'");
        Loop loop = Loop.fromOperator(operator);

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        when(executionManager.getLoops())
                .thenReturn(List.of(loop));


        // WHEN-THEN
        loop.setValue("a");
        loop.setIndex(0);
        Object val1 = extractValue("#ababab.(response).body.$.string_with_delimiter[i]~");
        assertEquals("a", val1);

        loop.setValue("d");
        loop.setIndex(3);
        Object val2 = extractValue("#ababab.(response).body.$.string_with_delimiter[i]~");
        assertEquals("d", val2);
    }

//    @Test
//    void extractFromJsonResponseBody_SPLIT_STRING_case4_2_2() {
//        // GIVEN
//        ResponseEntity<?> response = response(
//                200,
//                jsonResponseBody,
//                HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE
//        );
//
//        Operation operation = new Operation();
//        operation.setColor("#ababab");
//        operation.setLoopDepth(0);
//
//        operation.getResponses().put("#", response);
//
//        OperatorEx operator = new OperatorEx();
//        operator.setIndex("0");
//        operator.setType("SplitString");
//        operator.setIterator("i");
//        operator.setExpression("{%#ababab.(response).body.$.string_with_delimiter[*]~%} SplitString ';'");
//        Loop loop = Loop.fromOperator(operator);
//
//        when(executionManager.findOperationByColor("#ababab"))
//                .thenReturn(Optional.of(operation));
//
//        when(executionManager.generateKey(operation.getLoopDepth()))
//                .thenReturn("#");
//
//        when(executionManager.getLoops())
//                .thenReturn(List.of(loop));
//
//
//        // WHEN
//        Object val = extractValue("#ababab.(response).body.$.string_with_delimiter[*]~");
//
//
//        // THEN
//        assertTrue(val instanceof List);
//        assertEquals(List.of("a", "b", "c", "d"), val);
//    }
//
//    @Test
//    void extractFromJsonResponseBody_SPLIT_STRING_case4_2_3() {
//        // GIVEN
//        ResponseEntity<?> response = response(
//                200,
//                jsonResponseBody,
//                HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE
//        );
//
//        Operation operation = new Operation();
//        operation.setColor("#ababab");
//        operation.setLoopDepth(0);
//
//        operation.getResponses().put("#", response);
//
//        OperatorEx operator = new OperatorEx();
//        operator.setIndex("0");
//        operator.setType("SplitString");
//        operator.setIterator("i");
//        operator.setExpression("{%#ababab.(response).body.$.string_with_delimiter[*]~%} SplitString ';'");
//        Loop loop = Loop.fromOperator(operator);
//
//        when(executionManager.findOperationByColor("#ababab"))
//                .thenReturn(Optional.of(operation));
//
//        when(executionManager.generateKey(operation.getLoopDepth()))
//                .thenReturn("#");
//
//        when(executionManager.getLoops())
//                .thenReturn(List.of(loop));
//
//
//        // WHEN-THEN
//        loop.setIndex(0);
//        loop.setValue("a");
//        Object val1 = extractValue("#ababab.(response).body.$.string_with_delimiter[0]~");
//        assertEquals("a", val1);
//
//        loop.setIndex(2);
//        loop.setValue("c");
//        Object val2 = extractValue("#ababab.(response).body.$.string_with_delimiter[2]~");
//        assertEquals("c", val2);
//    }

    @Test
    void extractFromJsonResponseBodyAsPrimitive_FOR_case4_3_1() {
        // GIVEN
        ResponseEntity<?> response = response(
                200,
                jsonResponseBody,
                HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE
        );

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(0);

        operation.getResponses().put("#", response);

        OperatorEx operator = new OperatorEx();
        operator.setIndex("0");
        operator.setType("for");
        operator.setIterator("i");
        operator.setExpression("for {%#ababab.(response).body.$.list[*]%}");
        Loop loop = Loop.fromOperator(operator);

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        when(executionManager.getLoops())
                .thenReturn(List.of(loop));


        // WHEN-THEN
        loop.setIndex(0);
        loop.setValue("0");
        Object val1 = extractValue("#ababab.(response).body.$.list[i]");
        assertEquals("L1", val1);

        loop.setIndex(2);
        loop.setValue("2");
        Object val2 = extractValue("#ababab.(response).body.$.list[i]");
        assertEquals("L3", val2);
    }

    @Test
    void extractFromJsonResponseBodyAsObject_FOR_case4_3_1() {
        // GIVEN
        ResponseEntity<?> response = response(
                200,
                jsonResponseBody,
                HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE
        );

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(0);

        operation.getResponses().put("#", response);

        OperatorEx operator = new OperatorEx();
        operator.setIndex("0");
        operator.setType("for");
        operator.setIterator("i");
        operator.setExpression("for {%#ababab.(response).body.$.data.items[*]%}");
        Loop loop = Loop.fromOperator(operator);
        loop.setValue("1");

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        when(executionManager.getLoops())
                .thenReturn(List.of(loop));


        // WHEN-THEN
        Object val1 = extractValue("#ababab.(response).body.$.data.items[i].id");
        assertEquals(2, val1);

        Object val2 = extractValue("#ababab.(response).body.$.data.items[i].name");
        assertEquals("second", val2);

        Object val3 = extractValue("#ababab.(response).body.$.data.items[i].tags");
        assertTrue(val3 instanceof List);
        assertEquals(List.of("x", "y"), val3);
    }

    @Test
    void extractFromJsonResponseBody_FOR_case4_3_2() {
        // GIVEN
        ResponseEntity<?> response = response(
                200,
                jsonResponseBody,
                HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE
        );

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(0);

        operation.getResponses().put("#", response);


        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");


        // WHEN
        Object val = extractValue("#ababab.(response).body.$.list[1]");


        // THEN
        assertEquals("L2", val);
    }

    @Test
    void extractFromJsonResponseBody_FOR_case4_3_3() {
        // GIVEN
        ResponseEntity<?> response = response(
                200,
                jsonResponseBody,
                HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE
        );

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(0);

        operation.getResponses().put("#", response);


        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");


        // WHEN
        Object val = extractValue("#ababab.(response).body.$.list[*]");


        // THEN
        assertTrue(val instanceof List);
        assertEquals(List.of("L1", "L2", "L3"), val);
    }

    @Test
    void extractFromJsonResponseBodyBySimplePath_case4_4() {
        // GIVEN
        ResponseEntity<?> response = response(
                200,
                jsonResponseBody,
                HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE
        );

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(0);

        operation.getResponses().put("#", response);

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");


        // WHEN - THEN
        Object val1 = extractValue("#ababab.(response).body.$.status");
        assertEquals("ok", val1);

        Object val2 = extractValue("#ababab.(response).body.$.meta.version");
        assertEquals(3, val2);

        Object val3 = extractValue("#ababab.(response).body.$.list[*]");
        assertTrue(val3 instanceof List);
        assertEquals(3, ((List) val3).size());
    }

    @Test
    void extractFromJsonResponseBodyByPathWithSpecialSymbol_case4_4() {
        // GIVEN
        ResponseEntity<?> response = response(
                200,
                jsonResponseBody,
                HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE
        );

        Operation operation = new Operation();
        operation.setColor("#ababab");
        operation.setLoopDepth(0);

        operation.getResponses().put("#", response);

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");


        // WHEN - THEN
        Object val1 = extractValue("#ababab.(response).body.$.data.map_with_special_keys");
        assertTrue(val1 instanceof Map);
        assertTrue(((Map) val1).containsKey("key.with.dot"));

        Object val2 = extractValue("#ababab.(response).body.$.data.map_with_special_keys.['key.with.dot']");
        assertTrue(val2 instanceof Map);
        assertTrue(((Map) val2).containsKey("inner-value"));

        Object val3 = extractValue("#ababab.(response).body.$.data.map_with_special_keys.['key.with.dot'].inner-value");
        assertEquals(42, val3);
    }


    private ResponseEntity<?> response(int status, Object body, String headerName, String headerValue) {
        HttpHeaders headers = new HttpHeaders();
        headers.add(headerName, headerValue);
        return new ResponseEntity<>(body, headers, HttpStatus.valueOf(status));
    }


    private ResponseEntity<?> response(int status, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new ResponseEntity<>(body, headers, HttpStatus.valueOf(status));
    }
}
