package com.becon.opencelium.backend.unit.execution.oc721;

import com.becon.opencelium.backend.execution.ExecutionManager;
import com.becon.opencelium.backend.execution.oc721.Loop;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.execution.oc721.ReferenceExtractor;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import com.becon.opencelium.backend.testutil.fixture.OperationFixture;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ReferenceExtractor}.
 * <p>
 * No Spring context is loaded.
 */
@DisplayName("ReferenceExtractor — unit")
@ExtendWith(MockitoExtension.class)
public class ReferenceExtractorTest {
    @Mock
    ExecutionManager executionManager;

    @InjectMocks
    ReferenceExtractor extractor;

    /*
     * Test-only delegate for ReferenceExtractor.extractValue(..).
     * Used to reduce noise in "find usages" results from test code.
     */
    private Object extractValue(String rawReference) {
        return extractor.extractValue(rawReference);
    }


    //-----------------------------------------------------------
    //                    DIRECT_REFERENCE
    //-----------------------------------------------------------

    @Test
    void extractValueReturnsAllEntitiesWhenPathTargetsResponseList() {
        // GIVEN
        Operation operation = OperationFixture.anOperationInDoubleLoop();

        when(executionManager.findOperationByColor(operation.getColor()))
                .thenReturn(Optional.of(operation));

        // WHEN
        Object result = extractValue("#ababab.(response).[*]");

        // THEN
        assertInstanceOf(TreeMap.class, result);
        assertEquals(6, ((Map) result).size());
    }

    @Test
    void extractValueReturnsAllStatusesWhenPathTargetsResponseList() {
        // GIVEN
        Operation operation = OperationFixture.anOperationInDoubleLoop();

        when(executionManager.findOperationByColor(operation.getColor()))
                .thenReturn(Optional.of(operation));

        // WHEN
        Object result = extractValue("#ababab.(response).[*].status");

        // THEN
        assertInstanceOf(TreeMap.class, result);
        var statuses = (TreeMap<String, Integer>) result;

        assertEquals(
                List.of(200, 201, 202, 300, 301, 302),
                statuses.values().stream().toList()
        );
    }

    @Test
    void extractValueReturnsAllHeadersWhenPathTargetsResponseList() {
        // GIVEN
        Operation operation = OperationFixture.anOperationInDoubleLoop();

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        // WHEN
        Object result = extractValue("#ababab.(response).[*].header");

        // THEN
        assertInstanceOf(TreeMap.class, result);
        var headers = (TreeMap<String, Map<String, List<String>>>) result;

        headers.forEach((key, values) -> {
            assertTrue(values.get("index").contains(key.replace(", ", "_")));
        });
    }

    @Test
    void extractValueReturnsAllBodiesWhenPathTargetsResponseList() {
        // GIVEN
        Operation operation = OperationFixture.anOperationInDoubleLoop();

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        // WHEN
        Object result = extractValue("#ababab.(response).[*].body");

        // THEN
        assertInstanceOf(TreeMap.class, result);
        var bodies = (TreeMap<String, Object>) result;

        var expected = List.of(
                "{\"index\": \"0_0\"}", "{\"index\": \"0_1\"}", "{\"index\": \"0_2\"}",
                "{\"index\": \"1_0\"}", "{\"index\": \"1_1\"}", "{\"index\": \"1_2\"}"
        );
        assertEquals(expected, new ArrayList<>(bodies.values()));
    }

    @Test
    void extractValueReturnsAllResponseEntityStatusWhenCalledInALoop() {
        // GIVEN
        Operation operation = OperationFixture.anOperationInDoubleLoop();

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("1, 1");

        // WHEN
        Object status = extractValue("#ababab.(response).status");

        // THEN
        assertEquals(301, status);
    }

    @Test
    @DisplayName("obj['i']~ - field name on ith index (indexing starts from 0)")
    void extractValueReturnsFieldNameWhenIndexIsSpecified() {
        // GIVEN
        Operation operation = OperationFixture.anOperationWithResponseBody();

        Loop loop = loop("forin", "i", "forin {%#ababab.(response).body.$.meta%}");

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        when(executionManager.getLoops())
                .thenReturn(List.of(loop));

        // WHEN
        loop.setIndex(1);
        loop.setValue("version");

        Object val = extractValue("#ababab.(response).body.$.meta['i']~");

        // THEN
        assertEquals("version", val);
    }

    @Test
    @DisplayName("obj['*']~ - all field names")
    void extractValueReturnsAllFieldNamesWhenPathTargetsObject() {
        // GIVEN
        Operation operation = OperationFixture.anOperationWithResponseBody();

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
    @DisplayName("obj['field_name']~ - field_name itself")
    void extractValueReturnsFieldNameWhenPathPointsToField() {
        // GIVEN
        Operation operation = OperationFixture.anOperationWithResponseBody();

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
    @DisplayName("obj['i'] - value of the field on ith index (indexing starts from 0)")
    void extractValueReturnsFieldValueWhenIndexIsSpecified() {
        // GIVEN
        Operation operation = OperationFixture.anOperationWithResponseBody();

        // loop extracts targeted objects field names
        Loop loop = loop("forin", "i", "forin {%#ababab.(response).body.$.data.items[0]%}");

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        when(executionManager.getLoops())
                .thenReturn(List.of(loop));

        // WHEN-THEN
        loop.setIndex(1);
        loop.setValue("name");

        Object val1 = extractValue("#ababab.(response).body.$.data.items[0]['i']"); // primitive
        assertEquals("first", val1);

        loop.setIndex(3);
        loop.setValue("metrics");
        Object val2 = extractValue("#ababab.(response).body.$.data.items[0]['i']"); // object
        assertInstanceOf(Map.class, val2);
        var metrics = (Map<String, Object>) val2;
        assertEquals(10, metrics.get("count"));
        assertEquals(0.5, metrics.get("ratio"));
    }

    @Test
    @DisplayName("obj['field_name'] - value of the field by its name")
    void extractValueReturnsFieldValueWhenFieldNameProvided() {
        // GIVEN
        Operation operation = OperationFixture.anOperationWithResponseBody();

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        // WHEN
        Object val = extractValue("#ababab.(response).body.$.data['key_with_underscore']");

        // THEN
        assertInstanceOf(Map.class, val);
        Map keyWithUnderscore = (Map) val;
        assertTrue(keyWithUnderscore.containsKey("key.with.dot"));

        assertInstanceOf(Map.class, keyWithUnderscore.get("key.with.dot"));
        Map keyWithDot = (Map) keyWithUnderscore.get("key.with.dot");
        assertTrue(keyWithDot.containsKey("inner-value"));
        assertEquals(1, keyWithDot.size());
        assertEquals(42, keyWithDot.get("inner-value"));
    }

    @Test
    @DisplayName("field[i]~ - string on the ith index (indexing starts from 0)")
    void extractValueReturnsStringTokenWhenIndexFollowsSplit() {
        // GIVEN
        Operation operation = OperationFixture.anOperationWithResponseBody();

        Loop loop = loop("SplitString", "i", "{%#ababab.(response).body.$.string_with_delimiter[*]~%} SplitString ';'");

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        when(executionManager.getLoops())
                .thenReturn(List.of(loop));

        // WHEN-THEN
        loop.setValue("d");
        loop.setIndex(3);
        Object val2 = extractValue("#ababab.(response).body.$.string_with_delimiter[i]~");
        assertEquals("d", val2);
    }

    @Test
    @DisplayName("field[*]~- all strings (after splitting)")
    void extractValueReturnsAllTokensWhenPathContainsSplit() {
        // GIVEN
        Operation operation = OperationFixture.anOperationWithResponseBody();

        Loop loop = loop("SplitString", "i", "{%#ababab.(response).body.$.string_with_delimiter[*]~%} SplitString ';'");

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        when(executionManager.getLoops())
                .thenReturn(List.of(loop));

        // WHEN
        Object val = extractValue("#ababab.(response).body.$.string_with_delimiter[*]~");

        // THEN
        assertInstanceOf(List.class, val);
        assertEquals(List.of("a", "b", "c", "d"), val);
    }

    @Test
    @DisplayName("field[2]~ - string on the 2nd index (indexing starts from 0)")
    void extractValueReturnsTokenWhenExplicitIndexFollowsSplit() {
        // GIVEN
        Operation operation = OperationFixture.anOperationWithResponseBody();

        Loop loop = loop("SplitString", "i", "{%#ababab.(response).body.$.string_with_delimiter[*]~%} SplitString ';'");

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        when(executionManager.getLoops())
                .thenReturn(List.of(loop));

        // WHEN-THEN
        loop.setIndex(0);
        loop.setValue("a");
        Object val1 = extractValue("#ababab.(response).body.$.string_with_delimiter[0]~");
        assertEquals("a", val1);

        loop.setIndex(2);
        loop.setValue("c");
        Object val2 = extractValue("#ababab.(response).body.$.string_with_delimiter[2]~");
        assertEquals("c", val2);
    }

    @Test
    @DisplayName("array[i] - value on the ith index (indexing starts from 0)")
    void extractValueReturnsArrayElementWhenIndexIsSpecified() {
        // GIVEN
        Operation operation = OperationFixture.anOperationWithResponseBody();

        Loop loop = loop("for", "i", "for {%#ababab.(response).body.$.list[*]%}");

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
        assertEquals("L1", val1); // string

        loop.setIndex(2);
        loop.setValue("2");
        Object val2 = extractValue("#ababab.(response).body.$.list[i]");
        assertEquals("L3", val2); // string
    }

    @Test
    @DisplayName("array[i].field - field value of object on the ith index (indexing starts from 0)")
    void extractValueReturnsElementFieldValuesWhenIndexIsSpecified() {
        // GIVEN
        Operation operation = OperationFixture.anOperationWithResponseBody();

        Loop loop = loop("for", "i", "for {%#ababab.(response).body.$.data.items[*]%}");

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        when(executionManager.getLoops())
                .thenReturn(List.of(loop));

        // WHEN-THEN
        loop.setIndex(1);
        loop.setValue("1");

        Object val1 = extractValue("#ababab.(response).body.$.data.items[i].id");
        assertEquals(2, val1); // primitive

        Object val2 = extractValue("#ababab.(response).body.$.data.items[i].name");
        assertEquals("second", val2); // string

        Object val3 = extractValue("#ababab.(response).body.$.data.items[i].tags");
        assertInstanceOf(List.class, val3);
        assertEquals(List.of("x", "y"), val3); // collection
    }

    @Test
    @DisplayName("array[3] - value on the 3rd index (indexing starts from 0)")
    void extractValueReturnsArrayElementWhenExplicitIndexProvided() {
        // GIVEN
        Operation operation = OperationFixture.anOperationWithResponseBody();

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
    @DisplayName("array[*] - all values")
    void extractValueReturnsAllArrayElementsWhenPathTargetsArray() {
        // GIVEN
        Operation operation = OperationFixture.anOperationWithResponseBody();

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        // WHEN
        Object val = extractValue("#ababab.(response).body.$.list[*]");

        // THEN
        assertInstanceOf(List.class, val);
        assertEquals(List.of("L1", "L2", "L3"), val);
    }

    @Test
    void extractValueReturnsFieldValueWhenPathIsSimple() {
        // GIVEN
        Operation operation = OperationFixture.anOperationWithResponseBody();

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        // WHEN - THEN
        Object val1 = extractValue("#ababab.(response).body.$.status");
        assertEquals("ok", val1); // string

        Object val2 = extractValue("#ababab.(response).body.$.meta.version");
        assertEquals(3, val2);  // primitive
    }

    @Test
    void extractValueReturnsFieldValueWhenPathContainsSpecialSymbols() {
        // GIVEN
        Operation operation = OperationFixture.anOperationWithResponseBody();

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        // WHEN - THEN
        Object val1 = extractValue("#ababab.(response).body.$.data.key_with_underscore");
        assertInstanceOf(Map.class, val1);
        assertTrue(((Map) val1).containsKey("key.with.dot"));

        Object val2 = extractValue("#ababab.(response).body.$.data.key_with_underscore.['key.with.dot']");
        assertInstanceOf(Map.class, val2);
        assertTrue(((Map) val2).containsKey("inner-value"));

        Object val3 = extractValue("#ababab.(response).body.$.data.key_with_underscore.['key.with.dot'].inner-value");
        assertEquals(42, val3);
    }

    @Test
    void extractValueReturnsCollectionWhenPathContainsForForInForInLoopOperators() {
        // GIVEN
        Operation operation = OperationFixture.anOperationWithResponseBody();

        Loop loop1 = loop("for", "i", "for {%#ababab.(response).body.$.data.items[*]%}");
        Loop loop2 = loop("forin", "j", "forin {%#ababab.(response).body.$.data.items[i]%}");
        Loop loop3 = loop("forin", "k", "forin {%#ababab.(response).body.$.data.items[i]['j']%}");

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        when(executionManager.getLoops())
                .thenReturn(List.of(loop1, loop2, loop3));

        // WHEN - THEN
        // verify FOR loop creation (1st loop)
        Object val1 = extractValue("#ababab.(response).body.$.data.items[*]"); // loop1.getRef()
        assertInstanceOf(List.class, val1);
        assertEquals(2, ((List) val1).size());

        // verify FOR_IN keys loop creation (2nd loop)
        // it will be created in 1st loop, so we need to initialize its control values
        loop1.setIndex(1);
        loop1.setValue("1");
        Object val2 = extractValue("#ababab.(response).body.$.data.items[i]['*']~"); // loop2.getRef()
        assertInstanceOf(List.class, val2);
        assertEquals(List.of("id", "name", "tags", "metrics"), val2);

        // verify FOR_IN keys loop creation (3rd loop)
        // it will be created in 1st loop adn 2nd loop, so we need to initialize second loops control values
        loop2.setIndex(3);
        loop2.setValue("metrics");
        Object val3 = extractValue("#ababab.(response).body.$.data.items[i]['j']['*']~"); // loop3.getRef()
        assertInstanceOf(List.class, val3);
        assertEquals(List.of("count", "ratio"), val3);
    }

    @Test
    void extractValueReturnsCollectionWhenPathContainsForForInSplitStringLoopOperators() {
        // GIVEN
        Operation operation = OperationFixture.anOperationWithResponseBody();

        Loop loop1 = loop("for", "i", "for {%#ababab.(response).body.$.items[*]%}");
        Loop loop2 = loop("forin", "j", "forin {%#ababab.(response).body.$.items[i]%}");
        Loop loop3 = loop("SplitString", "k", "{%#ababab.(response).body.$.items[i]['j'][*]~%} SplitString '-'");

        when(executionManager.findOperationByColor("#ababab"))
                .thenReturn(Optional.of(operation));

        when(executionManager.generateKey(operation.getLoopDepth()))
                .thenReturn("#");

        when(executionManager.getLoops())
                .thenReturn(List.of(loop1, loop2, loop3));

        // WHEN - THEN
        // verify FOR loop creation (1st loop)
        Object val1 = extractValue("#ababab.(response).body.$.items[*]"); // loop1.getRef()
        assertInstanceOf(List.class, val1);
        assertEquals(1, ((List) val1).size());

        // verify FOR_IN keys loop creation (2nd loop)
        // it will be created in 1st loop, so we need to initialize its control values
        loop1.setIndex(0);
        loop1.setValue("0");
        Object val2 = extractValue("#ababab.(response).body.$.items[i]['*']~"); // loop2.getRef()
        assertInstanceOf(List.class, val2);
        assertEquals(List.of("name", "string"), val2);

        // verify FOR_IN keys loop creation (3rd loop)
        // it will be created in 1st loop adn 2nd loop, so we need to initialize second loops control values
        loop2.setIndex(1);
        loop2.setValue("string");
        Object val3 = extractValue("#ababab.(response).body.$.items[i]['j'][*]~"); // loop3.getRef()
        assertInstanceOf(List.class, val3);
        assertEquals(List.of("x", "y", "z"), val3);
    }


    private Loop loop(String type, String iterator, String expression) {
        OperatorEx operator = new OperatorEx();
        operator.setId("23123");
        operator.setIndex("1");
        operator.setType(type);
        operator.setIterator(iterator);
        operator.setExpression(expression);

        return Loop.fromOperator(operator);
    }
}
