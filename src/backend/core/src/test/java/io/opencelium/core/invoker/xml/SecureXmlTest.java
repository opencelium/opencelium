package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.w3c.dom.Document;

import javax.xml.validation.Schema;
import java.nio.file.Files;
import java.nio.file.Path;

import static io.opencelium.core.testutil.fixture.InvokerFiles.xml;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

class SecureXmlTest {

    private static final Schema GREETING = SecureXml.loadSchema("/invoker/xsd/greeting.xsd");

    // ── parse ────────────────────────────────────────────

    @Test
    void parseReturnsANamespaceAwareDocumentWithoutComments() {
        Document document = SecureXml.parse(xml("<invoker><!-- note --><name>X</name></invoker>"));

        assertThat(document.getDocumentElement().getLocalName()).isEqualTo("invoker");
        assertThat(document.getDocumentElement().getChildNodes().getLength()).isEqualTo(1);
    }

    @Test
    void parseReportsLineAndColumnWhenXmlIsMalformed() {
        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class,
                () -> SecureXml.parse(xml("<invoker>\n  <name>X</nam>\n</invoker>")));

        assertThat(failure.format()).isEmpty();
        assertThat(failure.issues()).singleElement().satisfies(issue -> {
            assertThat(issue.location()).isEqualTo("line 2, column 12");
            assertThat(issue.message()).startsWith("not well-formed XML: ");
        });
    }

    @Test
    void parseRefusesExternalEntitiesSoAFileCannotReadTheServersDisk(@TempDir Path directory) throws Exception {
        Path secret = Files.writeString(directory.resolve("secret.txt"), "canary-5f2a91");
        byte[] attack = xml("""
                <?xml version="1.0"?>
                <!DOCTYPE invoker [ <!ENTITY leak SYSTEM "%s"> ]>
                <invoker><name>&leak;</name></invoker>
                """.formatted(secret.toUri()));

        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class, () -> SecureXml.parse(attack));

        assertThat(failure.issues()).singleElement().extracting(InvokerIssue::message)
                .isEqualTo("DOCTYPE declarations are not allowed in invoker files");
        assertThat(failure).hasMessageNotContaining("canary-5f2a91");
    }

    @Test
    void parseRefusesEntityExpansionBombs() {
        byte[] bomb = xml("""
                <?xml version="1.0"?>
                <!DOCTYPE lolz [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;">]>
                <invoker><name>&b;</name></invoker>
                """);

        assertThatThrownBy(() -> SecureXml.parse(bomb))
                .isInstanceOf(InvokerReadException.class)
                .hasMessageContaining("DOCTYPE declarations are not allowed");
    }

    // ── loadSchema ───────────────────────────────────────

    @Test
    void loadSchemaThrowsWhenResourceIsMissing() {
        assertThatThrownBy(() -> SecureXml.loadSchema("/no/such.xsd"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("schema resource /no/such.xsd is missing from the classpath");
    }

    // ── validate ─────────────────────────────────────────

    @Test
    void validateAcceptsAFileThatMatchesTheSchema() {
        SecureXml.validate(GREETING, xml("<greeting lang='en'><count>3</count></greeting>"));
    }

    @Test
    void validateReportsEveryViolationWithLineAndColumnAndWithoutTheRuleCode() {
        byte[] invalid = xml("<greeting>\n<count>three</count>\n</greeting>");

        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class,
                () -> SecureXml.validate(GREETING, invalid));

        assertThat(failure.format()).contains(InvokerFormat.V6);
        assertThat(failure.issues()).allSatisfy(issue -> {
            assertThat(issue.severity()).isEqualTo(InvokerIssue.Severity.ERROR);
            assertThat(issue.location()).startsWith("line ");
            assertThat(issue.message()).doesNotStartWith("cvc-");
        });
        assertThat(failure.issues()).anySatisfy(issue -> assertThat(issue.message()).contains("'lang'"));
        assertThat(failure.issues()).anySatisfy(issue -> assertThat(issue.message()).contains("'three'"));
    }
}
