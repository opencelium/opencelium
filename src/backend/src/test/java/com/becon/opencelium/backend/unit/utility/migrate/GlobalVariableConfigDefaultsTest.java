package com.becon.opencelium.backend.unit.utility.migrate;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.utility.crypto.GlobalVariableCipher;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.TextNode;
import com.fasterxml.jackson.dataformat.yaml.YAMLMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

/**
 * Checks what the shipped configuration says about the key of secret global variables:
 * {@code application_default.yml}, which installations copy, and the change sets the startup
 * YAML migrator applies to an existing {@code application.yml}. Both are read from the
 * classpath; no Spring context is loaded.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalVariableConfigDefaultsTest"
 */
@DisplayName("Global variable configuration defaults — unit")
class GlobalVariableConfigDefaultsTest {

    private static final String DEFAULTS = "application_default.yml";
    private static final String CHANGELOG = "db/changelog/springboot/application_changelog.yml";
    private static final YAMLMapper YAML = new YAMLMapper();

    @Test
    @DisplayName("application_default.yml — secret-key is an empty string: the built-in default is used,"
            + " no key value ships in the file, and the System Configuration UI masks it as text")
    void secretKeyIsEmptyStringWhenDefaultsAreRead() throws IOException {
        String pointer = "/" + GlobalVariableCipher.KEY_PROPERTY.replace('.', '/');

        JsonNode secretKey = read(DEFAULTS).at(pointer);

        assertThat(secretKey).isEqualTo(TextNode.valueOf(""));
    }

    @Test
    @DisplayName("application_changelog.yml — no change set writes, moves or deletes secret-key or a parent"
            + " of it: 'add' replaces a value, so it would erase an own key")
    void changelogHasNoChangeSetForSecretKeyWhenChangelogIsRead() throws IOException {
        List<String> reaching = new ArrayList<>();

        for (JsonNode version : read(CHANGELOG).get("versions")) {
            for (JsonNode change : version.get("changes")) {
                pathsWrittenBy(change).stream()
                        .filter(GlobalVariableConfigDefaultsTest::reachesSecretKey)
                        .forEach(path -> reaching.add(version.get("version").asText() + ":"
                                + change.get("changeset").asText() + " " + path));
            }
        }

        assertThat(reaching).isEmpty();
    }

    private static JsonNode read(String resource) throws IOException {
        try (InputStream in = new ClassPathResource(resource).getInputStream()) {
            return YAML.readTree(in);
        }
    }

    /** The paths a change set changes: its own, and for a move or a rename also the target. */
    private static List<String> pathsWrittenBy(JsonNode change) {
        String path = change.get("path").asText();
        String operation = change.get("operation").asText();

        if ("move".equals(operation)) {
            return List.of(path, change.get("value").asText());
        }
        if ("rename".equals(operation)) {
            String parent = path.substring(0, path.lastIndexOf('.') + 1);
            return List.of(path, parent + change.get("value").asText());
        }
        return List.of(path);
    }

    /** Whether changing this path changes the key: it is the key or one of its parents. */
    private static boolean reachesSecretKey(String path) {
        String key = GlobalVariableCipher.KEY_PROPERTY;
        return key.equals(path) || key.startsWith(path + ".");
    }
}
