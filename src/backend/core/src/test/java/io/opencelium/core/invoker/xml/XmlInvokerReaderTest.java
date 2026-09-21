package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import io.opencelium.core.invoker.InvokerReader;
import io.opencelium.core.invoker.ReadResult;
import io.opencelium.common.invoker.operation.Operation;
import io.opencelium.common.invoker.schema.Field;
import io.opencelium.common.invoker.schema.ObjectSchema;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import static io.opencelium.core.testutil.fixture.InvokerFiles.PUBLISHED_JIRA_ASSET;
import static io.opencelium.core.testutil.fixture.InvokerFiles.PUBLISHED_SAP_B1;
import static io.opencelium.core.testutil.fixture.InvokerFiles.PUBLISHED_TRELLO;
import static io.opencelium.core.testutil.fixture.InvokerFiles.V5_CMDB_JSONRPC;
import static io.opencelium.core.testutil.fixture.InvokerFiles.V6_SERVICE_DESK;
import static io.opencelium.core.testutil.fixture.InvokerFiles.bytes;
import static io.opencelium.core.testutil.fixture.InvokerFiles.xml;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

class XmlInvokerReaderTest {

    private static final InvokerReader READER = new XmlInvokerReader();

    @Test
    void readReturnsTheInvokerUnchangedWhenFileIsV6() {
        ReadResult result = READER.read(bytes(V6_SERVICE_DESK));

        assertThat(result.format()).isEqualTo(InvokerFormat.V6);
        assertThat(result.upgraded()).isFalse();
        assertThat(result.issues()).isEmpty();
        assertThat(result.invoker().id()).isEqualTo("example-service-desk");
    }

    @Test
    void readUpgradesTheInvokerWhenFileIsLegacy() {
        ReadResult result = READER.read(bytes(V5_CMDB_JSONRPC));

        assertThat(result.format()).isEqualTo(InvokerFormat.LEGACY_V5);
        assertThat(result.upgraded()).isTrue();
        assertThat(result.issues()).isNotEmpty();
    }

    @Test
    void readTagsAFailureWithTheDetectedFormat() {
        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class,
                () -> READER.read(xml("<invoker><name>X</name><operations/></invoker>")));

        assertThat(failure.format()).contains(InvokerFormat.LEGACY_V5);
    }

    @Test
    void readRejectsContentOverTheSizeLimitBeforeParsingIt() {
        byte[] huge = new byte[XmlInvokerReader.MAX_CONTENT_BYTES + 1];

        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class, () -> READER.read(huge));

        assertThat(failure.format()).isEmpty();
        assertThat(failure.issues()).containsExactly(InvokerIssue.error("/",
                "the file is larger than the 10485760-byte limit for an invoker file"));
    }

    // ── published invokers ───────────────────────────────

    @Test
    void readUpgradesAPublishedInvokerWithoutRepeatedNames() {
        ReadResult result = READER.read(bytes(PUBLISHED_TRELLO));

        assertThat(result.invoker().id()).isEqualTo("trello");
        assertThat(result.invoker().operations()).hasSize(16);
        assertThat(result.issues()).noneMatch(issue -> issue.message().contains("more than once")
                || issue.message().contains("also named"));
    }

    @Test
    void readUpgradesAPublishedInvokerThatRepeatsAnOperationName() {
        ReadResult result = READER.read(bytes(PUBLISHED_JIRA_ASSET));

        assertThat(result.invoker().operations()).extracting(Operation::id)
                .contains("DeleteAssetTypes", "DeleteAssetTypes-delete");
    }

    @Test
    void readUpgradesAPublishedInvokerThatRepeatsAFieldName() {
        ReadResult result = READER.read(bytes(PUBLISHED_SAP_B1));

        ObjectSchema body = (ObjectSchema) result.invoker().operation("getSalesOrdersByID").orElseThrow()
                .responses().getFirst().body().schema();
        assertThat(body.fields()).extracting(Field::name).containsOnlyOnce("DocumentStatus");
    }

    /**
     * Every invoker of github.com/opencelium/invoker. Unit tests use no network, so this reads a local
     * clone and runs only when {@code INVOKER_CORPUS} points to it:
     * <pre>{@code
     * git clone https://github.com/opencelium/invoker.git /tmp/invoker
     * INVOKER_CORPUS=/tmp/invoker ./gradlew :core:test --tests "*XmlInvokerReaderTest" --rerun
     * }</pre>
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("publishedInvokers")
    @EnabledIfEnvironmentVariable(named = "INVOKER_CORPUS", matches = ".+")
    void readImportsEveryPublishedInvoker(Path file) throws IOException {
        byte[] content = Files.readAllBytes(file);

        assertThatCode(() -> READER.read(content)).doesNotThrowAnyException();
    }

    static Stream<Path> publishedInvokers() throws IOException {
        String corpus = System.getenv("INVOKER_CORPUS");
        if (corpus == null || corpus.isBlank()) {
            return Stream.empty();
        }
        try (Stream<Path> files = Files.list(Path.of(corpus))) {
            return files.filter(file -> file.toString().endsWith(".xml")).sorted().toList().stream();
        }
    }
}
