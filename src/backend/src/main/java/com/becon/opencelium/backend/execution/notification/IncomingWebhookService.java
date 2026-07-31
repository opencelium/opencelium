package com.becon.opencelium.backend.execution.notification;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class IncomingWebhookService implements CommunicationTool {

    private static final Logger log = LoggerFactory.getLogger(IncomingWebhookService.class);

    private static final String TEMPLATE_DIR = "notification/";
    private static final String DEFAULT_TEMPLATE = "default";

    // Matches a leading [tool] prefix; group(1)=tool, group(2)=the rest of the destination.
    private static final Pattern PREFIX = Pattern.compile("^\\[(\\w+)]\\s*(.*)$", Pattern.DOTALL);
    // Matches ${name} placeholders inside template string leaves.
    private static final Pattern PLACEHOLDER = Pattern.compile("\\$\\{(\\w+)}");

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

    // Base names of the templates shipped under notification/ (excluding "default"), longest first so a
    // more specific name wins when a URL happens to contain several. Enumerated once and cached.
    private volatile List<String> templateNames;

    public IncomingWebhookService(@Qualifier("webhookRestTemplate") RestTemplate webhookRestTemplate,
                                  ObjectMapper objectMapper) {
        this.restTemplate = webhookRestTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean sendMessage(String destination, String subject, String text) {
        Objects.requireNonNull(destination, "destination");

        Selection selection = select(destination);

        // Parse the (prefix-stripped) destination into a URI and fail fast on anything RestTemplate can't use.
        URI uri;
        try {
            uri = URI.create(selection.url());
            if (!uri.isAbsolute() || uri.getScheme() == null || uri.getHost() == null) {
                throw new IllegalArgumentException("URL must be an absolute http(s) URI");
            }
        } catch (IllegalArgumentException e) {
            log.error("Invalid incoming-webhook URL after prefix stripping: '{}'", selection.url(), e);
            return false;
        }

        // Build the request body from the resolved template via Jackson (never by string concatenation).
        String body;
        try {
            JsonNode template = loadTemplate(selection.templateName());
            JsonNode rendered = substitute(template, Map.of(
                    "subject", subject == null ? "" : subject,
                    "text", text == null ? "" : text));
            body = objectMapper.writeValueAsString(rendered);
        } catch (Exception e) {
            log.error("Failed to build incoming-webhook body from template '{}.json'", selection.templateName(), e);
            return false;
        }

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        HttpEntity<Object> httpEntity = new HttpEntity<>(body, httpHeaders);

        try {
            restTemplate.exchange(uri, HttpMethod.POST, httpEntity, String.class);
            return true;
        } catch (Exception e) {
            log.error("Failed to send incoming webhook to {}", uri, e);
            return false;
        }
    }

    @Override
    public void sendMessageUsingTemplate(String destination, String subject, String templateModel) {

    }

    /**
     * Resolves the template name and the real target URL from the destination string.
     * An explicit {@code [tool]} prefix wins over keyword matching; keyword matching is case-insensitive.
     */
    private Selection select(String destination) {
        String trimmed = destination.trim();

        Matcher prefixMatcher = PREFIX.matcher(trimmed);
        if (prefixMatcher.matches()) {
            String tool = prefixMatcher.group(1).toLowerCase();
            String url = prefixMatcher.group(2).trim();
            return new Selection(tool, url);
        }

        // No prefix: use the first template whose file name appears in the URL, else the default.
        String lower = trimmed.toLowerCase();
        String template = availableTemplateNames().stream()
                .filter(lower::contains)
                .findFirst()
                .orElse(DEFAULT_TEMPLATE);
        return new Selection(template, trimmed);
    }

    /**
     * Lists the base names of the templates under {@code notification/} (excluding {@code default}),
     * ordered longest-first. Enumerated from the classpath once and cached for the lifetime of the bean.
     */
    private List<String> availableTemplateNames() {
        List<String> names = templateNames;
        if (names == null) {
            synchronized (this) {
                names = templateNames;
                if (names == null) {
                    names = loadTemplateNames();
                    templateNames = names;
                }
            }
        }
        return names;
    }

    private List<String> loadTemplateNames() {
        try {
            Resource[] resources = resolver.getResources("classpath*:" + TEMPLATE_DIR + "*.json");
            return Arrays.stream(resources)
                    .map(Resource::getFilename)
                    .filter(Objects::nonNull)
                    .map(name -> name.substring(0, name.length() - ".json".length()).toLowerCase())
                    .filter(name -> !DEFAULT_TEMPLATE.equals(name))
                    .distinct()
                    .sorted(Comparator.comparingInt(String::length).reversed())
                    .toList();
        } catch (IOException e) {
            log.warn("Could not enumerate webhook templates under {}; only prefix/default selection will work", TEMPLATE_DIR, e);
            return List.of();
        }
    }

    /**
     * Loads and parses the template at {@code notification/<name>.json}. A missing non-default template
     * falls back to {@code default.json}; a missing default template is a hard error.
     */
    private JsonNode loadTemplate(String name) throws IOException {
        ClassPathResource resource = new ClassPathResource(TEMPLATE_DIR + name + ".json");
        if (!resource.exists()) {
            if (!DEFAULT_TEMPLATE.equals(name)) {
                log.warn("Webhook template '{}.json' not found; falling back to {}.json", name, DEFAULT_TEMPLATE);
                return loadTemplate(DEFAULT_TEMPLATE);
            }
            throw new FileNotFoundException("Missing default webhook template " + TEMPLATE_DIR + DEFAULT_TEMPLATE + ".json");
        }
        try (InputStream in = resource.getInputStream()) {
            return objectMapper.readTree(in);
        }
    }

    /**
     * Walks the parsed template tree and substitutes placeholders in every textual leaf. Objects and arrays
     * are rebuilt recursively; numbers/booleans/nulls pass through untouched. Substituted values are stored
     * as JSON text nodes, so Jackson escapes them correctly when the tree is re-serialised.
     */
    private JsonNode substitute(JsonNode node, Map<String, String> values) {
        if (node.isObject()) {
            ObjectNode result = objectMapper.createObjectNode();
            node.fields().forEachRemaining(entry -> result.set(entry.getKey(), substitute(entry.getValue(), values)));
            return result;
        }
        if (node.isArray()) {
            ArrayNode result = objectMapper.createArrayNode();
            node.forEach(child -> result.add(substitute(child, values)));
            return result;
        }
        if (node.isTextual()) {
            return TextNode.valueOf(replacePlaceholders(node.textValue(), values));
        }
        return node;
    }

    /**
     * Replaces {@code ${name}} placeholders in a single pass so a substituted value can never itself be
     * re-interpreted as a placeholder. Unknown placeholders are left verbatim.
     */
    private String replacePlaceholders(String text, Map<String, String> values) {
        Matcher matcher = PLACEHOLDER.matcher(text);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            String replacement = values.getOrDefault(matcher.group(1), matcher.group(0));
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private record Selection(String templateName, String url) {
    }
}
