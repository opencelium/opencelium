package com.becon.opencelium.backend.unit.reference;

import static com.becon.opencelium.backend.testutil.fixture.OperationDTOFixture.aParameter;
import static com.becon.opencelium.backend.testutil.fixture.OperationDTOFixture.anOperationWith;
import static com.becon.opencelium.backend.testutil.fixture.OperationDTOFixture.anOperationWithBody;
import static com.becon.opencelium.backend.testutil.fixture.SchemaDTOFixture.array;
import static com.becon.opencelium.backend.testutil.fixture.SchemaDTOFixture.object;
import static com.becon.opencelium.backend.testutil.fixture.SchemaDTOFixture.string;
import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.enums.execution.ParamLocation;
import com.becon.opencelium.backend.reference.OperationReferenceCollector;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link OperationReferenceCollector}.
 */
@DisplayName("OperationReferenceCollector — unit")
class OperationReferenceCollectorTest {

    @Test
    void collectReturnsEmptySetWhenOperationHasNoParametersOrBody() {
        Set<String> references = OperationReferenceCollector.collect(new OperationDTO());

        assertThat(references).isEmpty();
    }

    @Test
    void collectReturnsWholeValueWhenValueIsDirectReference() {
        OperationDTO operation = anOperationWith(
                aParameter(ParamLocation.HEADER, string("#c0ffee.(response).id")));

        Set<String> references = OperationReferenceCollector.collect(operation);

        assertThat(references).containsExactly("#c0ffee.(response).id");
    }

    @Test
    void collectReturnsEmbeddedReferencesWhenValueMixesTextAndReferences() {
        OperationDTO operation = anOperationWith(
                aParameter(ParamLocation.HEADER, string("Bearer {token}")));

        Set<String> references = OperationReferenceCollector.collect(operation);

        assertThat(references).containsExactly("{token}");
    }

    @Test
    @DisplayName("collect — reads path, query, header and cookie parameters")
    void collectReturnsReferencesWhenTheyAreInParameters() {
        OperationDTO operation = anOperationWith(
                aParameter(ParamLocation.PATH, string("{url}")),
                aParameter(ParamLocation.QUERY, string("${status}")),
                aParameter(ParamLocation.HEADER, string("{#12.token}")),
                aParameter(ParamLocation.COOKIE, string("{session}")));

        Set<String> references = OperationReferenceCollector.collect(operation);

        assertThat(references).containsExactly("{url}", "${status}", "{#12.token}", "{session}");
    }

    @Test
    void collectReturnsNestedReferencesWhenBodyIsObject() {
        OperationDTO operation = anOperationWithBody(
                object("customer", object("id", string("#c0ffee.(response).id"))));

        Set<String> references = OperationReferenceCollector.collect(operation);

        assertThat(references).containsExactly("#c0ffee.(response).id");
    }

    @Test
    void collectReturnsNestedReferencesWhenBodyIsArray() {
        OperationDTO operation = anOperationWithBody(array(string("${first}"), string("${second}")));

        Set<String> references = OperationReferenceCollector.collect(operation);

        assertThat(references).containsExactly("${first}", "${second}");
    }

    @Test
    @DisplayName("collect — like the request builder, reads properties of objects and items of arrays only")
    void collectSkipsChildrenWhenSchemaTypeDoesNotMatch() {
        SchemaDTO body = string(null);
        body.setProperties(Map.of("hidden", string("${hidden}")));
        body.setItems(Arrays.asList(string("${item}")));

        Set<String> references = OperationReferenceCollector.collect(anOperationWithBody(body));

        assertThat(references).isEmpty();
    }

    @Test
    @DisplayName("collect — a referenced value replaces the whole schema, so its children are not read")
    void collectSkipsChildrenWhenSchemaValueIsReference() {
        SchemaDTO body = object("child", string("${child}"));
        body.setValue("${whole}");

        Set<String> references = OperationReferenceCollector.collect(anOperationWithBody(body));

        assertThat(references).containsExactly("${whole}");
    }

    @Test
    void collectReturnsEachReferenceOnceWhenReferenceRepeats() {
        OperationDTO operation = anOperationWith(
                aParameter(ParamLocation.HEADER, string("{token}")),
                aParameter(ParamLocation.HEADER, string("${status}")),
                aParameter(ParamLocation.QUERY, string("{token}")));

        Set<String> references = OperationReferenceCollector.collect(operation);

        assertThat(references).containsExactly("{token}", "${status}");
    }

    @Test
    void collectSkipsNullParameterWhenParametersContainNull() {
        OperationDTO operation = anOperationWith(null, aParameter(ParamLocation.HEADER, string("{token}")));

        Set<String> references = OperationReferenceCollector.collect(operation);

        assertThat(references).containsExactly("{token}");
    }
}
