package com.becon.opencelium.backend.unit.execution.globalvariable;

import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.PRIVATE;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.PUBLIC;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aStoredField;
import static com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture.aScopedEntry;
import static com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture.aSnapshotOf;
import static com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture.anOpenEntry;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.exception.GlobalVariableNotFoundException;
import com.becon.opencelium.backend.execution.globalvariable.GlobalConnectorValues;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.fasterxml.jackson.databind.node.IntNode;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * Unit tests for {@link GlobalConnectorValues}: putting the values of global variables into the
 * request data of a connector, in place, before anything else reads it.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalConnectorValuesTest"
 */
@DisplayName("GlobalConnectorValues — unit")
class GlobalConnectorValuesTest {

    private static final GlobalVariableSnapshot SNAPSHOT = aSnapshotOf(
            anOpenEntry("idoitUrl", "https://cmdb.example.test"),
            anOpenEntry("host", "cmdb.example.test"),
            anOpenEntry("port", "8443"),
            new GlobalVariableSnapshot.Entry("pageSize", 1, IntNode.valueOf(50)),
            anOpenEntry("template", "{{global.idoitUrl}}"),
            aScopedEntry("apiKey", "k3y"));

    @Test
    @DisplayName("resolve — the value is overwritten in place; a field without a reference before it is passed over")
    void resolveReplacesReferenceWhenValueHoldsOne() {
        List<RequestData> requestData = List.of(
                aStoredField("token", "s3cr3t", PRIVATE),
                aStoredField("url", "{{global.idoitUrl}}/api", PUBLIC));

        GlobalConnectorValues.resolve(requestData, () -> SNAPSHOT);

        assertThat(requestData).extracting(RequestData::getValue)
                .containsExactly("s3cr3t", "https://cmdb.example.test/api");
    }

    @Test
    void resolveReplacesEveryReferenceWhenValueHoldsSeveral() {
        List<RequestData> requestData = List.of(aStoredField("address", "{{global.host}}:{{global.port}}", PUBLIC));

        GlobalConnectorValues.resolve(requestData, () -> SNAPSHOT);

        assertThat(requestData).extracting(RequestData::getValue).containsExactly("cmdb.example.test:8443");
    }

    @Test
    @DisplayName("resolve — a request data value is text, so a number is written as its literal")
    void resolveWritesTextWhenVariableIsNotText() {
        List<RequestData> requestData = List.of(aStoredField("limit", "{{global.pageSize}}", PUBLIC));

        GlobalConnectorValues.resolve(requestData, () -> SNAPSHOT);

        assertThat(requestData).extracting(RequestData::getValue).containsExactly("50");
    }

    @Test
    @DisplayName("resolve — a reference to another field, {url}, is not a global variable and stays for the next step")
    void resolveKeepsValueWhenItHoldsNoReference() {
        List<RequestData> requestData = List.of(
                aStoredField("url", "https://cmdb.example.test/api", PUBLIC),
                aStoredField("login", "{url}/login", PUBLIC));

        GlobalConnectorValues.resolve(requestData, () -> SNAPSHOT);

        assertThat(requestData).extracting(RequestData::getValue)
                .containsExactly("https://cmdb.example.test/api", "{url}/login");
    }

    @Test
    void resolveAsksForVariablesOnceWhenSeveralValuesHoldReferences() {
        List<RequestData> requestData = List.of(
                aStoredField("url", "{{global.idoitUrl}}/api", PUBLIC),
                aStoredField("host", "{{global.host}}", PUBLIC));
        AtomicInteger timesAsked = new AtomicInteger();

        GlobalConnectorValues.resolve(requestData, counting(timesAsked));

        assertThat(timesAsked).hasValue(1);
    }

    @Test
    @DisplayName("resolve — reading the variables costs a query, so it is left out where no field needs them")
    void resolveAsksForNoVariablesWhenNoValueHoldsReference() {
        List<RequestData> requestData = List.of(
                aStoredField("url", "https://cmdb.example.test/api", PUBLIC),
                aStoredField("login", "{url}/login", PUBLIC));
        AtomicInteger timesAsked = new AtomicInteger();

        GlobalConnectorValues.resolve(requestData, counting(timesAsked));

        assertThat(timesAsked).hasValue(0);
    }

    @Test
    @DisplayName("resolve — a value is data: a reference written in it is not resolved again")
    void resolveLeavesInsertedTokenUnresolvedWhenVariableValueHoldsOne() {
        List<RequestData> requestData = List.of(aStoredField("url", "{{global.template}}/api", PUBLIC));

        GlobalConnectorValues.resolve(requestData, () -> SNAPSHOT);

        assertThat(requestData).extracting(RequestData::getValue).containsExactly("{{global.idoitUrl}}/api");
    }

    @Test
    @DisplayName("resolve — a connector is shared by every workflow, so a scoped variable is not for it")
    void resolveThrowsGlobalVariableNotFoundExceptionWhenVariableIsScoped() {
        List<RequestData> requestData = List.of(aStoredField("token", "{{global.apiKey}}", PRIVATE));

        GlobalVariableNotFoundException notFound = catchThrowableOfType(
                () -> GlobalConnectorValues.resolve(requestData, () -> SNAPSHOT),
                GlobalVariableNotFoundException.class);

        assertThat(notFound)
                .hasMessageContaining("'apiKey'")
                .hasMessageContaining("is not open to all workflows");
        assertThat(notFound.getName()).isEqualTo("apiKey");
    }

    @Test
    @DisplayName("resolve — an unknown variable is an error, never an empty value")
    void resolveThrowsGlobalVariableNotFoundExceptionWhenVariableDoesNotExist() {
        List<RequestData> requestData = List.of(aStoredField("url", "{{global.missing}}/api", PUBLIC));

        GlobalVariableNotFoundException notFound = catchThrowableOfType(
                () -> GlobalConnectorValues.resolve(requestData, () -> SNAPSHOT),
                GlobalVariableNotFoundException.class);

        assertThat(notFound)
                .hasMessageContaining("'missing'")
                .hasMessageContaining("does not exist");
        assertThat(notFound.getName()).isEqualTo("missing");
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("requestDataWithNothingToRead")
    @DisplayName("resolve — request data, an entry or a value that is missing is passed over without an error")
    void resolveSkipsEntryWhenValueIsMissing(String description, List<RequestData> requestData) {
        AtomicInteger timesAsked = new AtomicInteger();

        GlobalConnectorValues.resolve(requestData, counting(timesAsked));

        assertThat(timesAsked).hasValue(0);
    }

    static Stream<Arguments> requestDataWithNothingToRead() {
        return Stream.of(
                Arguments.of("no request data", null),
                Arguments.of("an entry that is null", Collections.singletonList((RequestData) null)),
                Arguments.of("a value that is null", Arrays.asList(aStoredField("url", null, PUBLIC))));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /** Gives {@link #SNAPSHOT} and counts how often it is asked for. */
    private static Supplier<GlobalVariableSnapshot> counting(AtomicInteger timesAsked) {
        return () -> {
            timesAsked.incrementAndGet();
            return SNAPSHOT;
        };
    }
}
