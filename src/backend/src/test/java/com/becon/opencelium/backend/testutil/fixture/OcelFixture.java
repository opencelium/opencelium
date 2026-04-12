package com.becon.opencelium.backend.testutil.fixture;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Test data for OCEL expression evaluation tests.
 *
 * Provides a standard reference-value map that covers all reference formats
 * used in {@code PostfixExpressionProcessorTest}: plain ({…}), webhook (${…}),
 * wrapped-direct ({%…%}), and enhancement (#{…}).
 *
 * Usage:
 *   private static final Map<String, Object> REF = OcelFixture.referenceValues();
 *   private static final Function<String, Object> EXTRACTOR = OcelFixture.referenceExtractor();
 *
 * Do not mutate the map returned by {@link #referenceValues()} inside a test —
 * call {@link #referenceValuesWithNestedObject()} for tests that need the
 * nested-object entry.
 */
public final class OcelFixture {

    private OcelFixture() {}

    /**
     * Standard reference map covering plain, webhook, wrapped-direct, and
     * enhancement reference formats.
     */
    public static Map<String, Object> referenceValues() {
        Map<String, Object> m = new HashMap<>();

        // ── plain references ──────────────────────────────────────────────────
        m.put("{null}", null);
        m.put("{bool_true}", true);
        m.put("{bool_false}", false);
        m.put("{url}", "https://www.google.com");
        m.put("{number1}", 1);
        m.put("{number2}", 2);
        m.put("{number_1}", -1);
        m.put("{double1}", 1.0);
        m.put("{double2}", 2.0);
        m.put("{double_2}", -2.0);
        m.put("{name}", "Bob");
        m.put("{date_1}", "2020-01-01");
        m.put("{date_2}", "2020-02-02");
        m.put("{email}", "bob@gmail.com");
        m.put("{phone}", "1234567890");
        m.put("{array_of_numbers}", List.of(1, 2, 3, 4, 5));
        m.put("{array_of_strings}", List.of("hello", "world"));
        m.put("{array_of_bool}", List.of(true, false));
        m.put("{array_of_objects}", List.of(new LinkedHashMap<String, Object>() {{
            put("id", 1);
            put("name", "Bob");
        }}));
        m.put("{person_object}", new LinkedHashMap<String, Object>() {{
            put("id", 1);
            put("name", "Obid");
            put("address", "Tashkent");
        }});

        // ── webhook references ────────────────────────────────────────────────
        m.put("${null}", null);
        m.put("${bool_true}", true);
        m.put("${url}", "https://www.google.com");
        m.put("${number1}", 1);
        m.put("${number2}", 2);
        m.put("${number_1}", -1);
        m.put("${double1}", 1.0);
        m.put("${double2}", 2.0);
        m.put("${double_2}", -2.0);
        m.put("${name}", "Bob");
        m.put("${date_1}", "2020-01-01");
        m.put("${date_2}", "2020-02-02");
        m.put("${email}", "bob@gmail.com");
        m.put("${phone}", "1234567890");
        m.put("${array_of_numbers}", List.of(1, 2, 3, 4, 5));
        m.put("${array_of_strings}", List.of("hello", "world"));
        m.put("${array_of_bool}", List.of(true, false));
        m.put("${array_of_objects}", List.of(new LinkedHashMap<String, Object>() {{
            put("id", 1);
            put("name", "Bob");
        }}));

        // ── wrapped-direct references ─────────────────────────────────────────
        m.put("{%#ffffff.(response).body.$.null%}", null);
        m.put("{%#ffffff.(response).body.$.bool_true%}", true);
        m.put("{%#ffffff.(request).body.$.url%}", "https://www.google.com");
        m.put("{%#ffffff.(request).body.$.number1%}", 1);
        m.put("{%#ffffff.(request).body.$.number2%}", 2);
        m.put("{%#ffffff.(request).body.$.number_1%}", -1);
        m.put("{%#ffffff.(request).body.$.double1%}", 1.0);
        m.put("{%#ffffff.(request).body.$.double2%}", 2.0);
        m.put("{%#ffffff.(request).body.$.double_2%}", -2.0);
        m.put("{%#ffffff.(request).body.$.name%}", "Bob");
        m.put("{%#ffffff.(request).body.$.date_1%}", "2020-01-01");
        m.put("{%#ffffff.(request).body.$.date_2%}", "2020-02-02");
        m.put("{%#ffffff.(response).body.$.email%}", "bob@gmail.com");
        m.put("{%#ffffff.(request).body.$.phone%}", "1234567890");
        m.put("{%#ffffff.(response).body.$.array_of_numbers%}", List.of(1, 2, 3, 4, 5));
        m.put("{%#ffffff.(request).body.$.array_of_strings%}", List.of("hello", "world"));
        m.put("{%#ffffff.(response).body.$.array_of_bool%}", List.of(true, false));
        m.put("{%#ffffff.(request).body.$.array_of_objects%}", List.of(new LinkedHashMap<String, Object>() {{
            put("id", 1);
            put("name", "Bob");
        }}));
        m.put("{%#ffffff.(request).body.$.object%}", new LinkedHashMap<String, Object>() {{
            put("id", 1);
            put("name", "A");
        }});
        m.put("{%#ffffff.(request).body.$.person%}", new LinkedHashMap<String, Object>() {{
            put("id", 1);
            put("name", "Obid");
            put("address", "Tashkent");
        }});
        m.put("{%#ffffff.(request).body.$.person.address%}", new LinkedHashMap<String, Object>() {{
            put("id", 1);
            put("name", "Obid");
            put("address", "Tashkent");
        }});

        // ── enhancement references ────────────────────────────────────────────
        m.put("#{%600d5b5f4f3e2c1d8a7b6c00%}", null);
        m.put("#{%600d5b5f4f3e2c1d8a7b6c01%}", 1);
        m.put("#{%600d5b5f4f3e2c1d8a7b6c02%}", 2);
        m.put("#{%600d5b5f4f3e2c1d8a7b6c03%}", -1);
        m.put("#{%600d5b5f4f3e2c1d8a7b6c04%}", 1.0);
        m.put("#{%600d5b5f4f3e2c1d8a7b6c05%}", 2.0);
        m.put("#{%600d5b5f4f3e2c1d8a7b6c06%}", -2.0);
        m.put("#{%600d5b5f4f3e2c1d8a7b6c12%}", true);
        m.put("#{%600d5b5f4f3e2c1d8a7b6c13%}", "https://www.google.com");
        m.put("#{%600d5b5f4f3e2c1d8a7b6c15%}", "Bob");
        m.put("#{%600d5b5f4f3e2c1d8a7b6c16%}", "2020-01-01");
        m.put("#{%600d5b5f4f3e2c1d8a7b6c17%}", "2020-02-02");
        m.put("#{%600d5b5f4f3e2c1d8a7b6c18%}", "bob@gmail.com");
        m.put("#{%600d5b5f4f3e2c1d8a7b6c19%}", "1234567890");
        m.put("#{%600d5b5f4f3e2c1d8a7b6c20%}", List.of(1, 2, 3, 4, 5));
        m.put("#{%600d5b5f4f3e2c1d8a7b6c21%}", List.of("hello", "world"));
        m.put("#{%600d5b5f4f3e2c1d8a7b6c22%}", List.of(true, false));
        m.put("#{%600d5b5f4f3e2c1d8a7b6c23%}", List.of(new LinkedHashMap<String, Object>() {{
            put("id", 1);
            put("name", "Bob");
        }}));

        return m;
    }

    /**
     * Extends {@link #referenceValues()} with a nested-object entry used by
     * serialization tests.
     */
    public static Map<String, Object> referenceValuesWithNestedObject() {
        Map<String, Object> m = referenceValues();

        LinkedHashMap<String, Object> nested = new LinkedHashMap<>();
        nested.put("id", 10);
        nested.put("meta", new LinkedHashMap<String, Object>() {{
            put("name", "X");
            put("active", true);
        }});
        nested.put("tags", List.of("a", "b"));
        m.put("{%#ffffff.(request).body.$.nested_object%}", nested);

        return m;
    }
}