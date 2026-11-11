package com.becon.opencelium.backend.execution;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.util.MultiValueMap;

/**
 * Renders a built {@link RequestEntity} as a cURL command for a POSIX shell (bash, zsh, sh).
 *
 * <p>The command sends what the {@code RestTemplate} of a connection execution sends: the same
 * method, URL, headers and body bytes. Every argument is single-quoted, so URLs, JSON and XML
 * paste safely, and no value is read as a file the way {@code -d @file} or {@code -F name=<file}
 * would be. Each option goes on its own line, joined by a trailing backslash.
 *
 * <pre>{@code
 * String curl = CurlCommandBuilder.forRequest(request).insecure(true).build();
 * }</pre>
 */
public final class CurlCommandBuilder {

    private static final String LINE_BREAK = " \\\n  ";

    /** What a {@code RestTemplate} sends for a String body without a content type. */
    private static final String DEFAULT_TEXT_CONTENT_TYPE = MediaType.TEXT_PLAIN_VALUE;

    private final RequestEntity<?> request;
    private boolean insecure;
    private int connectTimeoutMillis;

    private CurlCommandBuilder(RequestEntity<?> request) {
        this.request = Objects.requireNonNull(request, "request");
    }

    /** Starts a command for {@code request}, which must have a method and a URL. */
    public static CurlCommandBuilder forRequest(RequestEntity<?> request) {
        return new CurlCommandBuilder(request);
    }

    /** Adds {@code --insecure} when the connector trusts any server certificate. */
    public CurlCommandBuilder insecure(boolean insecure) {
        this.insecure = insecure;
        return this;
    }

    /** Adds {@code --connect-timeout} when {@code connectTimeoutMillis} is positive. */
    public CurlCommandBuilder connectTimeoutMillis(int connectTimeoutMillis) {
        this.connectTimeoutMillis = connectTimeoutMillis;
        return this;
    }

    /** Returns the command. */
    public String build() {
        HttpMethod method = Objects.requireNonNull(request.getMethod(), "request method");
        Objects.requireNonNull(request.getUrl(), "request URL");
        HttpHeaders headers = request.getHeaders();
        String body = bodyOf(request.getBody(), headers.getContentType());

        List<String> parts = new ArrayList<>();
        parts.add("curl" + methodOption(method, body != null) + " " + quote(request.getUrl().toString()));

        if (insecure) {
            parts.add("--insecure");
        }

        if (connectTimeoutMillis > 0) {
            parts.add("--connect-timeout " + toSeconds(connectTimeoutMillis));
        }

        headers.forEach((name, values) -> {
            // curl computes the length of the body it sends; a stale one would break the request
            if (!HttpHeaders.CONTENT_LENGTH.equalsIgnoreCase(name)) {
                values.forEach(value -> parts.add("-H " + quote(header(name, value))));
            }
        });

        if (body != null && headers.getContentType() == null && request.getBody() instanceof String) {
            parts.add("-H " + quote(header(HttpHeaders.CONTENT_TYPE, DEFAULT_TEXT_CONTENT_TYPE)));
        }

        if (body != null) {
            parts.add("--data-raw " + quote(body));
        }

        return String.join(LINE_BREAK, parts);
    }

    /**
     * Returns the option that sets {@code method}. curl sends GET by default and POST once it has
     * data, so neither needs {@code -X}; HEAD needs {@code --head}, or curl waits for a body.
     */
    private static String methodOption(HttpMethod method, boolean hasBody) {
        if (HttpMethod.HEAD.equals(method)) {
            return " --head";
        }

        boolean implied = (HttpMethod.GET.equals(method) && !hasBody)
                || (HttpMethod.POST.equals(method) && hasBody);

        return implied ? "" : " -X " + method.name();
    }

    /**
     * Returns the body as the text curl should send, or {@code null} without a body. A form is
     * encoded the way Spring's {@code FormHttpMessageConverter} encodes it.
     */
    private static String bodyOf(Object body, MediaType contentType) {
        if (body == null) {
            return null;
        }

        if (body instanceof MultiValueMap<?, ?> form) {
            return toFormUrlencoded(form, charsetOf(contentType));
        }

        if (body instanceof byte[] bytes) {
            return new String(bytes, charsetOf(contentType));
        }

        return body.toString();
    }

    private static String toFormUrlencoded(MultiValueMap<?, ?> form, Charset charset) {
        List<String> pairs = new ArrayList<>();
        for (Map.Entry<?, ? extends List<?>> field : form.entrySet()) {
            String name = URLEncoder.encode(String.valueOf(field.getKey()), charset);
            for (Object value : field.getValue()) {
                pairs.add(value == null
                        ? name
                        : name + "=" + URLEncoder.encode(String.valueOf(value), charset));
            }
        }

        return String.join("&", pairs);
    }

    private static Charset charsetOf(MediaType contentType) {
        return contentType != null && contentType.getCharset() != null
                ? contentType.getCharset()
                : StandardCharsets.UTF_8;
    }

    /** Returns {@code -H} text; curl sends {@code Name;} as a header with an empty value. */
    private static String header(String name, String value) {
        return value == null || value.isEmpty() ? name + ";" : name + ": " + value;
    }

    private static String toSeconds(int millis) {
        return BigDecimal.valueOf(millis, 3).stripTrailingZeros().toPlainString();
    }

    /** Single-quotes {@code text} for a POSIX shell, where only {@code '} needs escaping. */
    private static String quote(String text) {
        return "'" + text.replace("'", "'\\''") + "'";
    }
}
