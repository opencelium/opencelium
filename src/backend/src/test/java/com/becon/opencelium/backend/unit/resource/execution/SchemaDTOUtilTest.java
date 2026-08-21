package com.becon.opencelium.backend.unit.resource.execution;

import com.becon.opencelium.backend.enums.execution.DataType;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTOUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static com.becon.opencelium.backend.testutil.fixture.SchemaDTOFixture.array;
import static com.becon.opencelium.backend.testutil.fixture.SchemaDTOFixture.bool;
import static com.becon.opencelium.backend.testutil.fixture.SchemaDTOFixture.integer;
import static com.becon.opencelium.backend.testutil.fixture.SchemaDTOFixture.number;
import static com.becon.opencelium.backend.testutil.fixture.SchemaDTOFixture.object;
import static com.becon.opencelium.backend.testutil.fixture.SchemaDTOFixture.primitive;
import static com.becon.opencelium.backend.testutil.fixture.SchemaDTOFixture.string;
import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("SchemaDTOUtil — unit")
class SchemaDTOUtilTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    // ── null ──────────────────────────────────────────────────────────────────

    @Test
    void fromObjectReturnsNullWhenValueIsNull() {
        assertThat(SchemaDTOUtil.fromObject(null))
                .isNull();
    }

    // ── primitives ────────────────────────────────────────────────────────────

    @ParameterizedTest(name = "{index}: {0} -> {1}")
    @MethodSource("primitiveValues")
    void fromObjectConvertsPrimitiveValue(Object input, DataType expectedType, String expectedValue) {
        // WHEN-THEN
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(input),
                primitive(expectedType, expectedValue
                )
        );
    }

    private static Stream<Arguments> primitiveValues() {
        return Stream.of(
                // String
                Arguments.of("", DataType.STRING, ""),
                Arguments.of("Kevin", DataType.STRING, "Kevin"),
                Arguments.of(" ", DataType.STRING, " "),
                Arguments.of("line 1\nline 2", DataType.STRING, "line 1\nline 2"),
                Arguments.of("\"quoted\"", DataType.STRING, "\"quoted\""),

                // Character
                Arguments.of('A', DataType.STRING, "A"),
                Arguments.of('\n', DataType.STRING, "\n"),
                Arguments.of('\u0041', DataType.STRING, "\u0041"),

                // Boolean
                Arguments.of(true, DataType.BOOLEAN, "true"),
                Arguments.of(false, DataType.BOOLEAN, "false"),

                // Integer
                Arguments.of((byte) 0, DataType.INTEGER, "0"),
                Arguments.of(Byte.MIN_VALUE, DataType.INTEGER, "-128"),
                Arguments.of(Byte.MAX_VALUE, DataType.INTEGER, "127"),

                Arguments.of((short) 0, DataType.INTEGER, "0"),
                Arguments.of(Short.MIN_VALUE, DataType.INTEGER, "-32768"),
                Arguments.of(Short.MAX_VALUE, DataType.INTEGER, "32767"),

                Arguments.of(0, DataType.INTEGER, "0"),
                Arguments.of(-42, DataType.INTEGER, "-42"),
                Arguments.of(Integer.MIN_VALUE, DataType.INTEGER, "-2147483648"),
                Arguments.of(Integer.MAX_VALUE, DataType.INTEGER, "2147483647"),

                Arguments.of(0L, DataType.INTEGER, "0"),
                Arguments.of(-42L, DataType.INTEGER, "-42"),
                Arguments.of(Long.MIN_VALUE, DataType.INTEGER, "-9223372036854775808"),
                Arguments.of(Long.MAX_VALUE, DataType.INTEGER, "9223372036854775807"),
                Arguments.of(new BigInteger("92233720368547758081234567890"), DataType.INTEGER, "92233720368547758081234567890"),
                Arguments.of(new BigInteger("-92233720368547758081234567890"), DataType.INTEGER, "-92233720368547758081234567890"),

                // Double
                Arguments.of(0.0F, DataType.NUMBER, "0.0"),
                Arguments.of(-0.5F, DataType.NUMBER, "-0.5"),
                Arguments.of(1.5F, DataType.NUMBER, "1.5"),

                Arguments.of(0.0D, DataType.NUMBER, "0.0"),
                Arguments.of(-0.5D, DataType.NUMBER, "-0.5"),
                Arguments.of(1.5D, DataType.NUMBER, "1.5"),

                // trailing zero(s) removal
                Arguments.of(new BigDecimal("10.50"), DataType.NUMBER, "10.5"),
                Arguments.of(new BigDecimal("-10.500"), DataType.NUMBER, "-10.5"),
                Arguments.of(new BigDecimal("0.00"), DataType.NUMBER, "0.0")
        );
    }

    // ── simple objects ────────────────────────────────────────────────────────

    @Test
    void fromObjectConvertsEmptyMapToEmptyObjectSchema() {
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(Map.of()),
                object()
        );
    }

    @Test
    void fromObjectConvertsFlatMapToObjectSchema() {
        // GIVEN
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("name", "Kevin");
        input.put("age", 42);
        input.put("ratio", 0.5);
        input.put("active", true);

        SchemaDTO expected = object(
                "name", string("Kevin"),
                "age", integer("42"),
                "ratio", number("0.5"),
                "active", bool("true")
        );

        // WHEN-THEN
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(input),
                expected
        );
    }

    @Test
    void fromObjectPreservesNullMapValue() {
        // GIVEN
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("name", "Kevin");
        input.put("department", null);

        SchemaDTO expected = object(
                "name", string("Kevin"),
                "department", null
        );

        // WHEN-THEN
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(input),
                expected
        );
    }

    @Test
    void fromObjectConvertsNonStringMapKeyToString() {
        // GIVEN
        Map<Object, Object> input = new LinkedHashMap<>();
        input.put(10, "ten");
        input.put(true, "boolean");

        SchemaDTO expected = object(
                "10", string("ten"),
                "true", string("boolean")
        );

        // WHEN-THEN
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(input),
                expected
        );
    }

    // ── simple arrays ─────────────────────────────────────────────────────────

    @Test
    void fromObjectConvertsEmptyListToEmptyArraySchema() {
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(List.of()),
                array()
        );
    }

    @Test
    void fromObjectConvertsHomogeneousListToArraySchema() {
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(List.of("A", "B", "C")),
                array(
                        string("A"),
                        string("B"),
                        string("C")
                )
        );
    }

    @Test
    void fromObjectConvertsHeterogeneousListToArraySchema() {
        // GIVEN
        List<?> input = List.of("A", 10, 0.5, true);

        SchemaDTO expected = array(
                string("A"),
                integer("10"),
                number("0.5"),
                bool("true")
        );

        // WHEN-THEN
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(input),
                expected
        );
    }

    @Test
    void fromObjectPreservesNullListElement() {
        // GIVEN
        List<?> input = Arrays.asList("A", null, "C");

        SchemaDTO expected = array(
                string("A"),
                null,
                string("C")
        );

        // WHEN-THEN
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(input),
                expected
        );
    }

    @Test
    void fromObjectConvertsObjectArrayToArraySchema() {
        // GIVEN
        Object[] input = {"A", 10, true};

        SchemaDTO expected = array(
                string("A"),
                integer("10"),
                bool("true")
        );

        // WHEN-THEN
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(input),
                expected
        );
    }

    @Test
    void fromObjectConvertsPrimitiveIntArrayToArraySchema() {
        // GIVEN
        int[] input = {10, 20, 30};

        SchemaDTO expected = array(
                integer("10"),
                integer("20"),
                integer("30")
        );

        // WHEN-THEN
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(input),
                expected
        );
    }

    @Test
    void fromObjectConvertsPrimitiveBooleanArrayToArraySchema() {
        // GIVEN
        boolean[] input = {true, false, true};

        SchemaDTO expected = array(
                bool("true"),
                bool("false"),
                bool("true")
        );

        // WHEN-THEN
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(input),
                expected
        );
    }


    // ── complex structures ───────────────────────────────────────────────────

    @Test
    void fromObjectConvertsNestedObjectsAndArrays() {
        // GIVEN
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("status", "ok");
        input.put("meta", Map.of(
                "response-id", "142",
                "version", 3
        ));
        input.put("items", List.of(
                Map.of(
                        "id", 1,
                        "name", "first",
                        "tags", List.of("a", "b", "c"),
                        "metrics", Map.of(
                                "count", 10,
                                "ratio", 0.5
                        )
                ),
                Map.of(
                        "id", 2,
                        "name", "second",
                        "tags", List.of("x", "y"),
                        "metrics", Map.of(
                                "count", 20,
                                "ratio", 1.5
                        )
                )
        ));
        input.put("last", true);

        SchemaDTO expected = object(
                "status", string("ok"),
                "meta", object(
                        "response-id", string("142"),
                        "version", integer("3")
                ),
                "items", array(
                        object(
                                "id", integer("1"),
                                "name", string("first"),
                                "tags", array(
                                        string("a"),
                                        string("b"),
                                        string("c")
                                ),
                                "metrics", object(
                                        "count", integer("10"),
                                        "ratio", number("0.5")
                                )
                        ),
                        object(
                                "id", integer("2"),
                                "name", string("second"),
                                "tags", array(
                                        string("x"),
                                        string("y")
                                ),
                                "metrics", object(
                                        "count", integer("20"),
                                        "ratio", number("1.5")
                                )
                        )
                ),
                "last", bool("true")
        );

        // THEN
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(input),
                expected
        );
    }

    @Test
    void fromObjectConvertsNestedNullsAtEveryLevel() {
        // GIVEN
        Map<String, Object> nestedObject = new LinkedHashMap<>();
        nestedObject.put("present", "value");
        nestedObject.put("missing", null);

        List<Object> nestedList = Arrays.asList(
                null,
                nestedObject,
                Arrays.asList("A", null)
        );

        Map<String, Object> input = new LinkedHashMap<>();
        input.put("nullProperty", null);
        input.put("nestedList", nestedList);

        SchemaDTO expected = object(
                "nullProperty", null,
                "nestedList", array(
                        null,
                        object(
                                "present", string("value"),
                                "missing", null
                        ),
                        array(
                                string("A"),
                                null
                        )
                )
        );

        // WHEN-THEN
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(input),
                expected
        );
    }

    // ── JsonNode ──────────────────────────────────────────────────────────────

    @Test
    void fromObjectConvertsObjectJsonNode() throws Exception {
        // GIVEN
        JsonNode input = OBJECT_MAPPER.readTree("""
                {
                  "id": 1,
                  "name": "Kevin",
                  "active": true,
                  "tags": ["a", "b"],
                  "optional": null
                }
                """);

        SchemaDTO expected = object(
                "id", integer("1"),
                "name", string("Kevin"),
                "active", bool("true"),
                "tags", array(
                        string("a"),
                        string("b")
                ),
                "optional", null
        );

        // WHEN-THEN
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(input),
                expected
        );
    }

    @Test
    void fromObjectConvertsArrayJsonNode() throws Exception {
        // GIVEN
        JsonNode input = OBJECT_MAPPER.readTree("""
                ["A", 10, 0.5, true, null, {"id": 1}]
                """);

        SchemaDTO expected = array(
                string("A"),
                integer("10"),
                number("0.5"),
                bool("true"),
                null,
                object(
                        "id", integer("1")
                )
        );

        // WHEN-THEN
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(input),
                expected
        );
    }

    @ParameterizedTest
    @MethodSource("primitiveJsonNodes")
    void fromObjectConvertsPrimitiveJsonNode(String json, SchemaDTO expected) throws Exception {
        // GIVEN
        JsonNode input = OBJECT_MAPPER.readTree(json);

        // WHEN-THEN
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(input),
                expected
        );
    }

    private static Stream<Arguments> primitiveJsonNodes() {
        return Stream.of(
                Arguments.of("\"Kevin\"", string("Kevin")),
                Arguments.of("42", integer("42")),
                Arguments.of("-42", integer("-42")),
                Arguments.of("0.5", number("0.5")),
                Arguments.of("true", bool("true")),
                Arguments.of("false", bool("false")),
                Arguments.of("null", null)
        );
    }

    // ── serializable fallback ─────────────────────────────────────────────────

    @Test
    void fromObjectConvertsSerializableObjectToObjectSchema() {
        // GIVEN
        TestValue input = new TestValue(
                "Kevin",
                42,
                true,
                List.of("developer", "admin")
        );

        SchemaDTO expected = object(
                "name", string("Kevin"),
                "score", integer("42"),
                "active", bool("true"),
                "roles", array(
                        string("developer"),
                        string("admin")
                )
        );

        // WHEN-THEN
        assertSchemaEquals(
                SchemaDTOUtil.fromObject(input),
                expected
        );
    }


    private static void assertSchemaEquals(SchemaDTO actual, SchemaDTO expected) {
        assertThat(actual)
                .usingRecursiveComparison()
                .isEqualTo(expected);
    }

    private record TestValue(
            String name,
            int score,
            boolean active,
            List<String> roles
    ) {
    }
}
