/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.applicationConfig;

import com.becon.opencelium.backend.appYml.dto.ApplicationConfigResponse;
import com.becon.opencelium.backend.appYml.dto.ConfigNode;
import com.becon.opencelium.backend.appYml.service.ApplicationConfigServiceImpl;
import com.becon.opencelium.backend.appYml.service.AtomicFileWriter;
import com.becon.opencelium.backend.appYml.service.YamlConfigReader;
import com.becon.opencelium.backend.appYml.service.YamlConfigWriter;
import com.becon.opencelium.backend.exception.ApplicationConfigValidationException;
import com.becon.opencelium.backend.exception.ApplicationConfigWriteException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("ApplicationConfigServiceImpl — read/patch orchestration")
class ApplicationConfigServiceImplTest {

    private final ObjectMapper json = new ObjectMapper();

    private ApplicationConfigServiceImpl service(Path target, Path tempDir) {
        return new ApplicationConfigServiceImpl(
                new YamlConfigReader(),
                new YamlConfigWriter(),
                new AtomicFileWriter(tempDir.resolve("backups"), 10),
                target.toString()
        );
    }

    @Test
    void readReturnsFieldTreeAndCommentsWhenFileExists(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        Files.writeString(target, """
                # header
                server:
                  port: 9090   # default
                """, StandardCharsets.UTF_8);

        ApplicationConfigResponse response = service(target, tempDir).read();

        ConfigNode port = find(response.fields(), "server.port");
        assertThat(port).isNotNull();
        assertThat(port.status()).isEqualTo(ConfigNode.ACTIVE);
        assertThat(((JsonNode) port.value()).asInt()).isEqualTo(9090);
    }

    @Test
    void patchEditsValueAndPreservesInlineCommentWhenFieldHasValue(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        Files.writeString(target, """
                server:
                  port: 9090   # http port
                """, StandardCharsets.UTF_8);

        JsonNode fields = json.readTree("""
                [ { "path": "server.port", "status": "active", "value": 8080 } ]
                """);
        service(target, tempDir).patch(fields);

        String after = Files.readString(target);
        assertThat(after).contains("port: 8080");
        assertThat(after).contains("# http port");

        try (var stream = Files.list(tempDir.resolve("backups"))) {
            assertThat(stream.filter(p -> p.getFileName().toString().startsWith("application.yml.bak.")).count())
                    .isEqualTo(1L);
        }
    }

    @Test
    void patchDisablesNodeWhenStatusInactive(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        Files.writeString(target, """
                server:
                  port: 9090
                  ssl:
                    enabled: true
                """, StandardCharsets.UTF_8);

        JsonNode fields = json.readTree("""
                [ { "path": "server.ssl", "status": "inactive" } ]
                """);
        service(target, tempDir).patch(fields);

        String after = Files.readString(target);
        assertThat(after).contains("port: 9090");
        assertThat(after).contains("#  ssl:");
        assertThat(after).contains("#    enabled: true");
    }

    @Test
    void patchDisableCascadesUpWhenLastActiveSiblingGone(@TempDir Path tempDir) throws IOException {
        // Disabling the only active leaf must also disable its parent — and
        // keep walking up as long as each ancestor is left with no other
        // active subtree.
        Path target = tempDir.resolve("application.yml");
        String original = """
                spring:
                  mail:
                    host: smtp
                """;
        Files.writeString(target, original, StandardCharsets.UTF_8);

        JsonNode fields = json.readTree("""
                [ { "path": "spring.mail.host", "status": "inactive" } ]
                """);
        service(target, tempDir).patch(fields);

        String after = Files.readString(target);
        // host disabled, mail disabled (no remaining child), spring disabled
        // (no remaining child).
        assertThat(after).contains("#    host: smtp");
        assertThat(after).contains("#  mail:");
        assertThat(after).contains("#spring:");
    }

    @Test
    void patchDisableCascadeStopsAtAncestorWithOtherActiveSubtree(@TempDir Path tempDir) throws IOException {
        // Disabling the last leaf of one branch must NOT touch ancestors that
        // still have other active descendants — the cascade only walks up
        // through ancestors that would be left empty.
        Path target = tempDir.resolve("application.yml");
        String original = """
                spring:
                  datasource:
                    url: jdbc:test
                  mail:
                    host: smtp.gmail.com
                """;
        Files.writeString(target, original, StandardCharsets.UTF_8);

        JsonNode fields = json.readTree("""
                [ { "path": "spring.mail.host", "status": "inactive" } ]
                """);
        service(target, tempDir).patch(fields);

        String after = Files.readString(target);
        // mail loses its only child, so mail is auto-disabled too.
        assertThat(after).contains("#  mail:");
        assertThat(after).contains("#    host: smtp.gmail.com");
        // spring still has datasource active — must stay active (no leading #).
        assertThat(after).startsWith("spring:");
        assertThat(after).contains("  datasource:");
        assertThat(after).contains("    url: jdbc:test");
    }

    @Test
    void patchRejectsWhenDisablingUnknownPath(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        String original = "server:\n  port: 9090\n";
        Files.writeString(target, original, StandardCharsets.UTF_8);

        JsonNode fields = json.readTree("""
                [ { "path": "nope.here", "status": "inactive" } ]
                """);

        assertThatThrownBy(() -> service(target, tempDir).patch(fields))
                .isInstanceOf(ApplicationConfigValidationException.class);
        assertThat(Files.readString(target)).isEqualTo(original);
    }

    @Test
    void patchLeavesOriginalUntouchedWhenWriterThrows(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        String original = """
                server:
                  port: 9090
                """;
        Files.writeString(target, original, StandardCharsets.UTF_8);

        YamlConfigWriter throwing = mock(YamlConfigWriter.class);
        when(throwing.merge(any(), any())).thenThrow(new ApplicationConfigWriteException("boom"));

        ApplicationConfigServiceImpl svc = new ApplicationConfigServiceImpl(
                new YamlConfigReader(),
                throwing,
                new AtomicFileWriter(tempDir.resolve("backups"), 10),
                target.toString()
        );

        JsonNode fields = json.readTree("""
                [ { "path": "server.port", "value": 8080 } ]
                """);

        assertThatThrownBy(() -> svc.patch(fields))
                .isInstanceOf(ApplicationConfigWriteException.class);
        assertThat(Files.readString(target)).isEqualTo(original);
    }

    @Test
    void readExposesCommentedOutBlockAsInactiveTreeWhenFileHasOne(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        Files.writeString(target, """
                server:
                  port: 9090
                #  ssl:
                #    enabled: true
                """, StandardCharsets.UTF_8);

        ApplicationConfigResponse response = service(target, tempDir).read();

        ConfigNode ssl = find(response.fields(), "server.ssl");
        assertThat(ssl).isNotNull();
        assertThat(ssl.status()).isEqualTo(ConfigNode.INACTIVE);
        ConfigNode enabled = find(response.fields(), "server.ssl.enabled");
        assertThat(enabled).isNotNull();
        assertThat(enabled.status()).isEqualTo(ConfigNode.INACTIVE);
        assertThat(((JsonNode) enabled.value()).asBoolean()).isTrue();
    }

    @Test
    void patchActivatesInactiveContainerAndChildWhenStatusActive(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        String original = """
                spring:
                  datasource:
                    url: jdbc:test
                #  mail:
                #    host: smtp.gmail.com
                """;
        Files.writeString(target, original, StandardCharsets.UTF_8);

        JsonNode fields = json.readTree("""
                [
                  { "path": "spring.mail", "status": "active" },
                  { "path": "spring.mail.host", "status": "active" }
                ]
                """);
        service(target, tempDir).patch(fields);

        String after = Files.readString(target);
        assertThat(after).contains("mail:");
        assertThat(after).contains("host: smtp.gmail.com");
        assertThat(after).doesNotContain("#  mail:");
        assertThat(after).doesNotContain("#    host:");
    }

    @Test
    void patchActivatesLeafCascadesUpToAncestorsButNotSiblings(@TempDir Path tempDir) throws IOException {
        // Activating only a deep leaf auto-enables each inactive ancestor's
        // key line. Sibling leaves under those ancestors stay commented —
        // that's how the user opts into a single field of a disabled block.
        Path target = tempDir.resolve("application.yml");
        String original = """
                websocket:
                  endpoint: /websocket
                #  ssl:
                #    enabled: true
                #    key-store-type: PKCS12
                #    key-store-password: root
                """;
        Files.writeString(target, original, StandardCharsets.UTF_8);

        JsonNode fields = json.readTree("""
                [ { "path": "websocket.ssl.key-store-password", "status": "active" } ]
                """);
        service(target, tempDir).patch(fields);

        String after = Files.readString(target);
        // ssl: and key-store-password: get uncommented.
        assertThat(after).contains("\n  ssl:");
        assertThat(after).contains("\n    key-store-password: root");
        // Other ssl children stay commented — siblings are NOT auto-activated.
        assertThat(after).contains("#    enabled: true");
        assertThat(after).contains("#    key-store-type: PKCS12");
    }

    @Test
    void patchRejectsActivatingLeafWhenAncestorBeingDisabledInSamePatch(@TempDir Path tempDir) throws IOException {
        // Self-contradiction: cascade-up would auto-activate `spring.mail`,
        // but the same patch tries to disable it.
        Path target = tempDir.resolve("application.yml");
        String original = """
                spring:
                  mail:
                    host: smtp.gmail.com
                    port: 587
                """;
        Files.writeString(target, original, StandardCharsets.UTF_8);

        JsonNode fields = json.readTree("""
                [
                  { "path": "spring.mail", "status": "inactive" },
                  { "path": "spring.mail.host", "status": "active" }
                ]
                """);

        assertThatThrownBy(() -> service(target, tempDir).patch(fields))
                .isInstanceOf(ApplicationConfigValidationException.class)
                .hasMessageContaining("is being disabled in the same patch");
        assertThat(Files.readString(target)).isEqualTo(original);
    }

    @Test
    void patchActivatesParentAndCascadesToAllDescendants(@TempDir Path tempDir) throws IOException {
        // Activating a container enables its whole subtree — caller does not
        // need to enumerate children. (Mirrors deactivation, which already
        // cascades down via the writer's block-comment range.)
        Path target = tempDir.resolve("application.yml");
        String original = """
                spring:
                  datasource:
                    url: jdbc:test
                #  mail:
                #    host: smtp.gmail.com
                #    port: 587
                """;
        Files.writeString(target, original, StandardCharsets.UTF_8);

        JsonNode fields = json.readTree("""
                [ { "path": "spring.mail", "status": "active" } ]
                """);
        service(target, tempDir).patch(fields);

        String after = Files.readString(target);
        assertThat(after).contains("mail:");
        assertThat(after).contains("host: smtp.gmail.com");
        assertThat(after).contains("port: 587");
        assertThat(after).doesNotContain("#  mail:");
        assertThat(after).doesNotContain("#    host:");
        assertThat(after).doesNotContain("#    port:");
    }

    @Test
    void patchActivatesDoublyCommentedPropertyByStrippingBothHashes(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        String original = """
                spring:
                  mail:
                    opencelium:
                      from: noreply@opencelium.io
                  #    enabled: false
                """;
        // Force a double-comment shape directly so the test is unambiguous.
        Files.writeString(target, """
                spring:
                #  mail:
                #    opencelium:
                #      from: noreply@opencelium.io
                #  #    enabled: false
                """, StandardCharsets.UTF_8);

        JsonNode fields = json.readTree("""
                [ { "path": "spring.mail", "status": "active" } ]
                """);
        service(target, tempDir).patch(fields);

        String after = Files.readString(target);
        assertThat(after).contains("enabled: false");
        assertThat(after).doesNotContain("#    enabled: false");
        assertThat(after).doesNotContain("#  #    enabled: false");
    }

    @Test
    void patchAcceptsDisableWhenSiblingActiveLeafRemains(@TempDir Path tempDir) throws IOException {
        // server has port (active) and ssl (inactive on disk). Disabling port
        // would leave the container with no active children, but disabling an
        // already-inactive sibling like ssl must be a no-op, not a violation.
        Path target = tempDir.resolve("application.yml");
        String original = """
                server:
                  port: 9090
                #  ssl:
                #    enabled: true
                """;
        Files.writeString(target, original, StandardCharsets.UTF_8);

        JsonNode fields = json.readTree("""
                [ { "path": "server.ssl", "status": "inactive" } ]
                """);
        service(target, tempDir).patch(fields);

        String after = Files.readString(target);
        // port stays active; ssl block was already inactive and stays inactive.
        assertThat(after).contains("port: 9090");
        assertThat(after).contains("#  ssl:");
        assertThat(after).contains("#    enabled: true");
    }

    @Test
    void patchThrowsWhenFieldsIsNotArray(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        Files.writeString(target, "key: value\n", StandardCharsets.UTF_8);

        JsonNode notArray = json.readTree("{ \"path\": \"key\" }");

        assertThatThrownBy(() -> service(target, tempDir).patch(notArray))
                .isInstanceOf(ApplicationConfigValidationException.class);
    }

    @SuppressWarnings("unchecked")
    private ConfigNode find(List<ConfigNode> fields, String path) {
        for (ConfigNode node : fields) {
            if (node.path().equals(path)) {
                return node;
            }
            if (node.value() instanceof List<?> children) {
                ConfigNode found = find((List<ConfigNode>) children, path);
                if (found != null) {
                    return found;
                }
            }
        }
        return null;
    }
}
