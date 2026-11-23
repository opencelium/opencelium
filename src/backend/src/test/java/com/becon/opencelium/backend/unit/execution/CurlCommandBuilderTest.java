package com.becon.opencelium.backend.unit.execution;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.becon.opencelium.backend.execution.CurlCommandBuilder;
import java.net.URI;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

/** Unit tests for {@link CurlCommandBuilder}. */
@DisplayName("CurlCommandBuilder — unit")
class CurlCommandBuilderTest {

    private static final URI URL = URI.create("https://api.test/orders?status=open");
    private static final String BREAK = " \\\n  ";

    // ── method ────────────────────────────────────────────────────────────────

    @Test
    void buildOmitsMethodWhenRequestIsGetWithoutBody() {
        String curl = CurlCommandBuilder.forRequest(new RequestEntity<>(HttpMethod.GET, URL)).build();

        assertThat(curl).isEqualTo("curl 'https://api.test/orders?status=open'");
    }

    @Test
    void buildOmitsMethodWhenRequestIsPostWithBody() {
        String curl = CurlCommandBuilder.forRequest(jsonRequest(HttpMethod.POST, "{}")).build();

        assertThat(curl).startsWith("curl 'https://api.test/orders?status=open'").doesNotContain("-X");
    }

    @Test
    @DisplayName("build — a body would turn GET into POST, so GET with a body is set explicitly")
    void buildSetsMethodWhenGetHasBody() {
        String curl = CurlCommandBuilder.forRequest(jsonRequest(HttpMethod.GET, "{}")).build();

        assertThat(curl).startsWith("curl -X GET ");
    }

    @Test
    void buildSetsMethodWhenRequestIsPostWithoutBody() {
        String curl = CurlCommandBuilder.forRequest(new RequestEntity<>(HttpMethod.POST, URL)).build();

        assertThat(curl).startsWith("curl -X POST ");
    }

    @Test
    void buildSetsMethodWhenRequestIsDelete() {
        String curl = CurlCommandBuilder.forRequest(new RequestEntity<>(HttpMethod.DELETE, URL)).build();

        assertThat(curl).isEqualTo("curl -X DELETE 'https://api.test/orders?status=open'");
    }

    @Test
    @DisplayName("build — HEAD uses --head, because -X HEAD makes curl wait for a body")
    void buildUsesHeadOptionWhenRequestIsHead() {
        String curl = CurlCommandBuilder.forRequest(new RequestEntity<>(HttpMethod.HEAD, URL)).build();

        assertThat(curl).isEqualTo("curl --head 'https://api.test/orders?status=open'");
    }

    // ── headers ───────────────────────────────────────────────────────────────

    @Test
    void buildAddsOneHeaderOptionPerValueWhenHeaderRepeats() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Accept", "application/json");
        headers.add("Accept", "text/plain");

        String curl = CurlCommandBuilder.forRequest(new RequestEntity<>(headers, HttpMethod.GET, URL)).build();

        assertThat(curl).isEqualTo("curl 'https://api.test/orders?status=open'"
                + BREAK + "-H 'Accept: application/json'"
                + BREAK + "-H 'Accept: text/plain'");
    }

    @Test
    @DisplayName("build — an empty header value is written as 'Name;', since 'Name:' removes the header")
    void buildWritesSemicolonWhenHeaderValueIsEmpty() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Empty", "");

        String curl = CurlCommandBuilder.forRequest(new RequestEntity<>(headers, HttpMethod.GET, URL)).build();

        assertThat(curl).contains("-H 'X-Empty;'");
    }

    @Test
    void buildSkipsContentLengthWhenHeaderIsSet() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setContentLength(2);

        String curl = CurlCommandBuilder.forRequest(new RequestEntity<>("{}", headers, HttpMethod.POST, URL)).build();

        assertThat(curl).doesNotContainIgnoringCase("content-length");
    }

    // ── body ──────────────────────────────────────────────────────────────────

    @Test
    void buildWritesRawDataWhenBodyIsText() {
        String curl = CurlCommandBuilder.forRequest(jsonRequest(HttpMethod.POST, "{\"name\":\"box\"}")).build();

        assertThat(curl).isEqualTo("curl 'https://api.test/orders?status=open'"
                + BREAK + "-H 'Content-Type: application/json'"
                + BREAK + "--data-raw '{\"name\":\"box\"}'");
    }

    @Test
    @DisplayName("build — a text body without content type is sent as text/plain, like the RestTemplate does")
    void buildAddsTextContentTypeWhenTextBodyHasNone() {
        String curl = CurlCommandBuilder.forRequest(
                new RequestEntity<>("hello", new HttpHeaders(), HttpMethod.POST, URL)).build();

        assertThat(curl).contains("-H 'Content-Type: text/plain'");
    }

    @Test
    @DisplayName("build — a form is URL-encoded the way Spring's FormHttpMessageConverter sends it")
    void buildEncodesFormWhenBodyIsMultiValueMap() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("name", "big box");
        form.add("tag", "a&b");
        form.add("tag", "c");
        form.add("flag", null);

        String curl = CurlCommandBuilder.forRequest(new RequestEntity<>(form, headers, HttpMethod.POST, URL)).build();

        assertThat(curl).endsWith("--data-raw 'name=big+box&tag=a%26b&tag=c&flag'");
    }

    // ── quoting ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("build — a single quote ends the quoted text, is escaped, and quoting resumes")
    void buildEscapesSingleQuoteWhenValueContainsIt() {
        String curl = CurlCommandBuilder.forRequest(jsonRequest(HttpMethod.POST, "{\"name\":\"O'Brien\"}")).build();

        assertThat(curl).endsWith("--data-raw '{\"name\":\"O'\\''Brien\"}'");
    }

    @Test
    @DisplayName("build — shell characters and a leading @ stay literal inside single quotes")
    void buildKeepsShellCharactersLiteralWhenValueContainsThem() {
        String curl = CurlCommandBuilder.forRequest(jsonRequest(HttpMethod.POST, "@body $HOME `id` \"x\"")).build();

        assertThat(curl).endsWith("--data-raw '@body $HOME `id` \"x\"'");
    }

    // ── connector options ─────────────────────────────────────────────────────

    @Test
    void buildAddsInsecureWhenConnectorTrustsAnyCertificate() {
        String curl = CurlCommandBuilder.forRequest(new RequestEntity<>(HttpMethod.GET, URL))
                .insecure(true)
                .build();

        assertThat(curl).isEqualTo("curl 'https://api.test/orders?status=open'" + BREAK + "--insecure");
    }

    @Test
    void buildAddsConnectTimeoutInSecondsWhenTimeoutIsPositive() {
        String curl = CurlCommandBuilder.forRequest(new RequestEntity<>(HttpMethod.GET, URL))
                .connectTimeoutMillis(1500)
                .build();

        assertThat(curl).endsWith("--connect-timeout 1.5");
    }

    @Test
    void buildOmitsConnectTimeoutWhenTimeoutIsZero() {
        String curl = CurlCommandBuilder.forRequest(new RequestEntity<>(HttpMethod.GET, URL))
                .connectTimeoutMillis(0)
                .build();

        assertThat(curl).doesNotContain("--connect-timeout");
    }

    @Test
    void forRequestThrowsNullPointerExceptionWhenRequestIsNull() {
        assertThatThrownBy(() -> CurlCommandBuilder.forRequest(null))
                .isInstanceOf(NullPointerException.class);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static RequestEntity<String> jsonRequest(HttpMethod method, String body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new RequestEntity<>(body, headers, method, URL);
    }
}
