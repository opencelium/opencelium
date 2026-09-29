package com.becon.opencelium.backend.testutil.fake;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

/**
 * Fake reference extractor for OCEL expression evaluation tests.
 *
 * Replaces the real extractor with pre-defined values loaded once at construction
 * from {@code src/test/resources/fake/ocel-reference-values.json}.
 * To add or change a reference value, edit that file — no Java changes needed.
 */
public final class FakeReferenceExtractor {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String RESOURCE = "/fake/ocel-reference-values.json";
    private static final Map<String, Object> referenceValues = referenceValues();

    public Object getValue(String reference){
        return referenceValues.get(reference);
    }

    private static Map<String, Object> referenceValues() {
        try (InputStream is = FakeReferenceExtractor.class.getResourceAsStream(RESOURCE)) {
            if (is == null) {
                throw new IllegalStateException("Test fixture not found on classpath: " + RESOURCE);
            }
            return MAPPER.readValue(is, new TypeReference<>() {
            });
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load test fixture: " + RESOURCE, e);
        }
    }
}
