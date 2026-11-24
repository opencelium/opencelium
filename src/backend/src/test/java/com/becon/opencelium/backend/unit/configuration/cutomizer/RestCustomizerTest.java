package com.becon.opencelium.backend.unit.configuration.cutomizer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mockConstruction;

import com.becon.opencelium.backend.configuration.cutomizer.RestCustomizer;
import java.util.ArrayList;
import java.util.List;
import org.apache.hc.client5.http.auth.UsernamePasswordCredentials;
import org.apache.hc.client5.http.impl.routing.DefaultProxyRoutePlanner;
import org.apache.hc.core5.http.HttpHost;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.MockedConstruction;
import org.springframework.web.client.RestTemplate;

/** Unit tests for the proxy settings {@link RestCustomizer} puts on the HTTP client it builds. */
@DisplayName("RestCustomizer — unit")
class RestCustomizerTest {

    private static final String PROXY_HOST = "proxy.example.test";
    private static final String PROXY_PORT = "3128";
    private static final String PROXY_USER = "configured-proxy-user";
    private static final String PROXY_PASSWORD = "configured-proxy-password";

    @Test
    void customizeUsesConfiguredProxyCredentialsWhenCertificateIsTrusted() {
        RestCustomizer customizer = new RestCustomizer(PROXY_HOST, PROXY_PORT, PROXY_USER, PROXY_PASSWORD, true, 0);

        List<List<String>> credentials = proxyCredentialsBuiltBy(customizer);

        assertThat(credentials).containsExactly(List.of(PROXY_USER, PROXY_PASSWORD));
    }

    @Test
    void customizeUsesConfiguredProxyCredentialsWhenCertificateIsNotTrusted() {
        RestCustomizer customizer = new RestCustomizer(PROXY_HOST, PROXY_PORT, PROXY_USER, PROXY_PASSWORD, false, 0);

        List<List<String>> credentials = proxyCredentialsBuiltBy(customizer);

        assertThat(credentials).containsExactly(List.of(PROXY_USER, PROXY_PASSWORD));
    }

    @Test
    void customizeRoutesThroughConfiguredProxyWhenCertificateIsTrusted() {
        RestCustomizer customizer = new RestCustomizer(PROXY_HOST, PROXY_PORT, PROXY_USER, PROXY_PASSWORD, true, 0);

        List<HttpHost> proxies = proxiesRoutedThroughBy(customizer);

        assertThat(proxies).containsExactly(new HttpHost(PROXY_HOST, Integer.parseInt(PROXY_PORT)));
    }

    @Test
    void customizeRoutesThroughConfiguredProxyWhenCertificateIsNotTrusted() {
        RestCustomizer customizer = new RestCustomizer(PROXY_HOST, PROXY_PORT, PROXY_USER, PROXY_PASSWORD, false, 0);

        List<HttpHost> proxies = proxiesRoutedThroughBy(customizer);

        assertThat(proxies).containsExactly(new HttpHost(PROXY_HOST, Integer.parseInt(PROXY_PORT)));
    }

    /** Runs {@code customize} and returns the proxy of every proxy route planner it creates. */
    private static List<HttpHost> proxiesRoutedThroughBy(RestCustomizer customizer) {
        List<HttpHost> proxies = new ArrayList<>();
        try (MockedConstruction<DefaultProxyRoutePlanner> ignored = mockConstruction(
                DefaultProxyRoutePlanner.class,
                (mock, context) -> proxies.add((HttpHost) context.arguments().get(0)))) {
            customizer.customize(new RestTemplate());
        }
        return proxies;
    }

    /** Runs {@code customize} and returns the user and password of every credentials object it creates. */
    private static List<List<String>> proxyCredentialsBuiltBy(RestCustomizer customizer) {
        List<List<String>> credentials = new ArrayList<>();
        try (MockedConstruction<UsernamePasswordCredentials> ignored = mockConstruction(
                UsernamePasswordCredentials.class,
                (mock, context) -> credentials.add(List.of(
                        (String) context.arguments().get(0),
                        new String((char[]) context.arguments().get(1)))))) {
            customizer.customize(new RestTemplate());
        }
        return credentials;
    }
}
