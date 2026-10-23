package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.InvokerReadException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static io.opencelium.core.testutil.fixture.InvokerFiles.xml;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class XmlFormatDetectorTest {

    private static InvokerFormat detect(String text) {
        return XmlFormatDetector.detect(SecureXml.parse(xml(text)));
    }

    @Test
    void detectReturnsLegacyWhenRootHasNoVersion() {
        assertThat(detect("<invoker type=\"RESTful\"/>")).isEqualTo(InvokerFormat.LEGACY_V5);
    }

    @ParameterizedTest
    @ValueSource(strings = {"6", "6.0", " 6.3 "})
    void detectReturnsV6WhenMajorVersionIsSix(String version) {
        assertThat(detect("<invoker version=\"" + version + "\"/>")).isEqualTo(InvokerFormat.V6);
    }

    @Test
    void detectThrowsWhenFileIsWrittenForANewerMajorVersion() {
        assertThatThrownBy(() -> detect("<invoker version=\"7.0\"/>"))
                .isInstanceOf(InvokerReadException.class)
                .hasMessage("/invoker: unsupported invoker format version '7.0'; "
                        + "it was written for a newer version of OpenCelium");
    }

    @Test
    void detectThrowsWhenAnOlderFileStatesAVersion() {
        assertThatThrownBy(() -> detect("<invoker version=\"5.0\"/>"))
                .isInstanceOf(InvokerReadException.class)
                .hasMessage("/invoker: unsupported invoker format version '5.0'; "
                        + "a 5.x file has no version attribute, and the current version is 6.0");
    }

    @Test
    void detectThrowsWhenVersionIsNotANumber() {
        assertThatThrownBy(() -> detect("<invoker version=\"latest\"/>"))
                .isInstanceOf(InvokerReadException.class)
                .hasMessage("/invoker: 'latest' is not a format version; expected 6.0");
    }

    @Test
    void detectThrowsWhenRootDeclaresANamespace() {
        assertThatThrownBy(() -> detect("<invoker xmlns=\"http://example.com/invoker\" version=\"6.0\"/>"))
                .isInstanceOf(InvokerReadException.class)
                .hasMessage("/invoker: invoker files do not use an XML namespace; "
                        + "remove the namespace 'http://example.com/invoker' from <invoker>");
    }

    @Test
    void detectThrowsWhenRootIsNotAnInvoker() {
        assertThatThrownBy(() -> detect("<connector/>"))
                .isInstanceOf(InvokerReadException.class)
                .hasMessage("/connector: the root element must be <invoker>, but this file starts with <connector>");
    }
}
