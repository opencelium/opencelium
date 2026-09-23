package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import org.junit.jupiter.api.Test;

import static io.opencelium.core.testutil.fixture.InvokerFiles.xml;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

class XmlInvokerParserTest {

    private static final XmlInvokerParser PARSER = new XmlInvokerParser();

    @Test
    void parseReturnsTheDocumentAndFormatWhenFileIsCurrent() {
        InvokerDocument file = PARSER.parse(xml("""
                <invoker version="6.0" id="service-desk">
                    <name>Service Desk</name>
                </invoker>
                """));

        assertThat(file.format()).isEqualTo(InvokerFormat.V6);
        assertThat(file.legacy()).isFalse();
        assertThat(file.document().getDocumentElement().getAttribute("id")).isEqualTo("service-desk");
    }

    @Test
    void parseReturnsLegacyFormatWhenFileHasNoVersion() {
        InvokerDocument file = PARSER.parse(xml("<invoker type=\"RESTful\"><name>Demo CMDB</name></invoker>"));

        assertThat(file.format()).isEqualTo(InvokerFormat.LEGACY_V5);
        assertThat(file.legacy()).isTrue();
    }

    @Test
    void parseRejectsContentOverTheSizeLimitBeforeParsingIt() {
        byte[] huge = new byte[XmlInvokerParser.MAX_CONTENT_BYTES + 1];

        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class, () -> PARSER.parse(huge));

        assertThat(failure.format()).isEmpty();
        assertThat(failure.issues()).containsExactly(InvokerIssue.error("/",
                "the file is larger than the 10485760-byte limit for an invoker file"));
    }

    @Test
    void parseReportsWhereTheFileIsMalformed() {
        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class,
                () -> PARSER.parse(xml("<invoker>\n  <name>X</nam>\n</invoker>")));

        assertThat(failure.issues()).singleElement().extracting(InvokerIssue::location)
                .isEqualTo("line 2, column 12");
    }

    @Test
    void parseRejectsAFileThatIsNotAnInvoker() {
        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class,
                () -> PARSER.parse(xml("<connector version=\"6.0\"/>")));

        assertThat(failure).hasMessage("/connector: the root element must be <invoker>, "
                + "but this file starts with <connector>");
    }
}
