package io.opencelium.core.invoker.xml;

import io.opencelium.common.invoker.Invoker;
import io.opencelium.common.invoker.schema.ScalarType;
import io.opencelium.common.invoker.setting.ConnectorSetting;
import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import io.opencelium.core.invoker.InvokerReader;
import io.opencelium.core.invoker.ReadResult;
import org.junit.jupiter.api.Test;

import static io.opencelium.core.testutil.fixture.InvokerFiles.V6_SERVICE_DESK;
import static io.opencelium.core.testutil.fixture.InvokerFiles.bytes;
import static io.opencelium.core.testutil.fixture.InvokerFiles.v6Minimal;
import static io.opencelium.core.testutil.fixture.InvokerFiles.v6WithSettings;
import static io.opencelium.core.testutil.fixture.InvokerFiles.xml;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

class XmlInvokerReaderTest {

    private static final InvokerReader READER = new XmlInvokerReader(new XmlInvokerParser());

    private static InvokerReadException failure(byte[] file) {
        return catchThrowableOfType(InvokerReadException.class, () -> READER.read(file));
    }

    // ── the invoker ──────────────────────────────────────

    @Test
    void readMapsEveryPartOfTheInvokerHeader() {
        ReadResult result = READER.read(bytes(V6_SERVICE_DESK));
        Invoker invoker = result.invoker();

        assertThat(result.format()).isEqualTo(InvokerFormat.V6);
        assertThat(result.upgraded()).isFalse();
        assertThat(result.issues()).isEmpty();
        assertThat(invoker.id()).isEqualTo("example-service-desk");
        assertThat(invoker.name()).isEqualTo("Example Service Desk");
        assertThat(invoker.description()).isEqualTo("Reference invoker used by the tests.");
        assertThat(invoker.hint()).isEqualTo("Enter your instance URL.");
        assertThat(invoker.icon()).isEqualTo("service-desk.png");
        assertThat(invoker.authType()).isEqualTo("token");
        assertThat(invoker.categoryTags()).containsExactlyInAnyOrder("Ticketing", "Service Desk");
    }

    @Test
    void readLeavesOptionalPartsNullWhenTheFileOmitsThem() {
        Invoker invoker = READER.read(v6Minimal()).invoker();

        assertThat(invoker.id()).isEqualTo("minimal");
        assertThat(invoker.name()).isEqualTo("Minimal");
        assertThat(invoker.description()).isNull();
        assertThat(invoker.hint()).isNull();
        assertThat(invoker.icon()).isNull();
        assertThat(invoker.authType()).isNull();
        assertThat(invoker.categoryTags()).isEmpty();
        assertThat(invoker.settings()).isEmpty();
    }

    @Test
    void readKeepsACategoryTagOnlyOnceWhenItIsRepeated() {
        byte[] file = xml("""
                <invoker version="6.0" id="minimal">
                    <name>Minimal</name>
                    <category_tags>
                        <item>Ticketing</item>
                        <item>Ticketing</item>
                    </category_tags>
                </invoker>
                """);

        assertThat(READER.read(file).invoker().categoryTags()).containsExactly("Ticketing");
    }

    // ── settings ─────────────────────────────────────────

    @Test
    void readMapsSettingsInDeclarationOrderWithTheirTypeAndVisibility() {
        Invoker invoker = READER.read(bytes(V6_SERVICE_DESK)).invoker();

        assertThat(invoker.settings()).extracting(ConnectorSetting::name)
                .containsExactly("url", "username", "password", "retries", "sessionToken", "basicAuth");
        assertThat(invoker.setting("url")).contains(
                new ConnectorSetting("url", ScalarType.STRING, "public", "https://acme.example.com", null));
        assertThat(invoker.setting("password")).contains(
                new ConnectorSetting("password", ScalarType.STRING, "protected", null, null));
        assertThat(invoker.setting("retries")).contains(
                new ConnectorSetting("retries", ScalarType.INTEGER, "public", "3", null));
    }

    @Test
    void readKeepsAPrivateSettingsSourceExactlyAsWritten() {
        Invoker invoker = READER.read(bytes(V6_SERVICE_DESK)).invoker();

        assertThat(invoker.setting("sessionToken")).contains(new ConnectorSetting(
                "sessionToken", ScalarType.STRING, "private", null, "%{login.body.result.session-id}"));
        assertThat(invoker.setting("basicAuth")).map(ConnectorSetting::source).contains("{username:password}");
    }

    @Test
    void readReturnsEmptyWhenNoSettingHasThatName() {
        assertThat(READER.read(bytes(V6_SERVICE_DESK)).invoker().setting("apikey")).isEmpty();
    }

    @Test
    void readRejectsAPrivateSettingWithoutASource() {
        byte[] file = v6WithSettings("<item name=\"token\" visibility=\"private\"/>");

        assertThat(failure(file).issues()).singleElement().satisfies(issue -> {
            assertThat(issue.location()).isEqualTo("/invoker/requiredData/item[@name='token']");
            assertThat(issue.message()).isEqualTo("setting 'token' is private, so it is never asked for "
                    + "and needs a source to derive it from");
        });
    }

    @Test
    void readRejectsASettingThatHasASourceButIsNotPrivate() {
        byte[] file = v6WithSettings("<item name=\"token\" source=\"%{login.body.token}\"/>");

        assertThat(failure(file).issues()).singleElement().extracting(InvokerIssue::message)
                .isEqualTo("setting 'token' has a source, so it is derived and must be private, not public");
    }

    @Test
    void readReportsEveryBadSettingRatherThanStoppingAtTheFirst() {
        byte[] file = v6WithSettings("""
                <item name="a" visibility="private"/>
                <item name="b" source="%{login.body.token}"/>
                """);

        assertThat(failure(file).issues()).extracting(InvokerIssue::location).containsExactly(
                "/invoker/requiredData/item[@name='a']", "/invoker/requiredData/item[@name='b']");
    }

    @Test
    void readRejectsTwoSettingsWithTheSameName() {
        byte[] file = v6WithSettings("""
                <item name="url">https://one.example.com</item>
                <item name="url">https://two.example.com</item>
                """);

        assertThat(failure(file).issues()).singleElement().satisfies(issue -> {
            assertThat(issue.location()).isEqualTo("/invoker");
            assertThat(issue.message()).isEqualTo("invoker 'minimal' declares setting 'url' more than once");
        });
    }

    @Test
    void readRejectsAVisibilityTheFormatDoesNotDefine() {
        byte[] file = v6WithSettings("<item name=\"url\" visibility=\"secret\"/>");

        assertThat(failure(file).issues())
                .allSatisfy(issue -> assertThat(issue.location()).startsWith("line "))
                .anySatisfy(issue -> assertThat(issue.message()).contains("'secret'"));
    }

    // ── the file itself ──────────────────────────────────

    @Test
    void readReportsEverySchemaViolationWithLineNumbers() {
        byte[] file = xml("""
                <invoker version="6.0">
                    <name>X</name>
                    <summary>not part of the format</summary>
                </invoker>
                """);

        InvokerReadException failure = failure(file);

        assertThat(failure.format()).contains(InvokerFormat.V6);
        assertThat(failure.issues()).hasSizeGreaterThanOrEqualTo(2)
                .allSatisfy(issue -> assertThat(issue.location()).startsWith("line "));
        assertThat(failure.issues()).anySatisfy(issue -> assertThat(issue.message()).contains("'id'"));
        assertThat(failure.issues()).anySatisfy(issue -> assertThat(issue.message()).contains("'summary'"));
    }

    @Test
    void readRejectsAnInvokerWithABlankName() {
        byte[] file = xml("<invoker version=\"6.0\" id=\"minimal\"><name>   </name></invoker>");

        assertThat(failure(file).issues())
                .allSatisfy(issue -> assertThat(issue.location()).isEqualTo("line 1, column 53"))
                .anySatisfy(issue -> assertThat(issue.message()).contains("of element 'name' is not valid"));
    }

    @Test
    void readRejectsALegacyFileUntilTheLegacyReaderExists() {
        byte[] file = xml("<invoker type=\"RESTful\"><name>Demo CMDB</name></invoker>");

        InvokerReadException failure = failure(file);

        assertThat(failure.format()).contains(InvokerFormat.LEGACY_V5);
        assertThat(failure.issues()).singleElement().extracting(InvokerIssue::message)
                .isEqualTo("5.x invoker files cannot be read yet; save the file in format 6.0");
    }
}
