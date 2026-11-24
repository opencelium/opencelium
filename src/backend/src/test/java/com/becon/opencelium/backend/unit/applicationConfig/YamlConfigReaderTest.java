/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.applicationConfig;

import com.becon.opencelium.backend.appYml.dto.ConfigNode;
import com.becon.opencelium.backend.appYml.dto.NodeComment;
import com.becon.opencelium.backend.appYml.service.YamlConfigReader;
import com.becon.opencelium.backend.exception.ApplicationConfigReadException;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("YamlConfigReader — node tree projection and comment extraction")
class YamlConfigReaderTest {

    private final YamlConfigReader reader = new YamlConfigReader();

    @Test
    void readReturnsNestedNodesWhenYamlContainsMapping() {
        String yaml = """
                server:
                  port: 9090
                  address: 127.0.0.1
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        ConfigNode server = find(result.fields(), "server");
        assertThat(server).isNotNull();
        assertThat(server.status()).isEqualTo(ConfigNode.ACTIVE);
        assertThat(server.value()).isInstanceOf(List.class);

        assertThat(scalar(find(result.fields(), "server.port")).asInt()).isEqualTo(9090);
        assertThat(scalar(find(result.fields(), "server.address")).asText()).isEqualTo("127.0.0.1");
    }

    @Test
    void readReturnsScalarArrayLeafWhenYamlContainsSequence() {
        String yaml = """
                cors:
                  origins:
                    - http://localhost:3000
                    - http://localhost:4000
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        JsonNode origins = scalar(find(result.fields(), "cors.origins"));
        assertThat(origins.isArray()).isTrue();
        assertThat(origins.get(0).asText()).isEqualTo("http://localhost:3000");
        assertThat(origins.get(1).asText()).isEqualTo("http://localhost:4000");
    }

    @Test
    void readMarksUncommentedNodesActive() {
        String yaml = """
                opencelium:
                  token:
                    secret: abc123
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        assertThat(find(result.fields(), "opencelium").status()).isEqualTo(ConfigNode.ACTIVE);
        assertThat(find(result.fields(), "opencelium.token").status()).isEqualTo(ConfigNode.ACTIVE);
        assertThat(find(result.fields(), "opencelium.token.secret").status()).isEqualTo(ConfigNode.ACTIVE);
    }

    @Test
    void readMarksCommentedOutBlockAsInactiveContainerWithInactiveChildren() {
        String yaml = """
                server:
                  port: 9090
                #  ssl:
                #    enabled: true
                #    key-store-type: PKCS12
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        ConfigNode ssl = find(result.fields(), "server.ssl");
        assertThat(ssl).isNotNull();
        assertThat(ssl.status()).isEqualTo(ConfigNode.INACTIVE);
        assertThat(ssl.value()).isInstanceOf(List.class);

        ConfigNode enabled = find(result.fields(), "server.ssl.enabled");
        assertThat(enabled).isNotNull();
        assertThat(enabled.status()).isEqualTo(ConfigNode.INACTIVE);
        assertThat(scalar(enabled).asBoolean()).isTrue();

        ConfigNode keyStoreType = find(result.fields(), "server.ssl.key-store-type");
        assertThat(keyStoreType).isNotNull();
        assertThat(keyStoreType.status()).isEqualTo(ConfigNode.INACTIVE);
        assertThat(scalar(keyStoreType).asText()).isEqualTo("PKCS12");
    }

    @Test
    void readKeepsActiveSiblingsActiveWhenInactiveBlockAppearsBetween() {
        String yaml = """
                server:
                  port: 9090
                #  ssl:
                #    enabled: true
                  address: 127.0.0.1
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        assertThat(find(result.fields(), "server").status()).isEqualTo(ConfigNode.ACTIVE);
        assertThat(find(result.fields(), "server.port").status()).isEqualTo(ConfigNode.ACTIVE);
        assertThat(find(result.fields(), "server.address").status()).isEqualTo(ConfigNode.ACTIVE);
        assertThat(find(result.fields(), "server.ssl").status()).isEqualTo(ConfigNode.INACTIVE);
        assertThat(find(result.fields(), "server.ssl.enabled").status()).isEqualTo(ConfigNode.INACTIVE);
    }

    @Test
    void readPreservesInnerHashInDoubleCommentedBlockComment() {
        // Inside an inactive block the user writes inner doc comments with two
        // `#`s (`#    # text`). Only the outer marker is the block-comment
        // marker, so the comment text must retain the inner `#`.
        String yaml = """
                opencelium:
                  version: 5.0
                #  polyglot:
                #    # Communication protocol used to connect to the polyglot service.
                #    # Supported: grpc (default), http (future)
                #    # Default: grpc
                #    protocol: grpc
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        ConfigNode protocol = find(result.fields(), "opencelium.polyglot.protocol");
        assertThat(protocol).isNotNull();
        assertThat(protocol.status()).isEqualTo(ConfigNode.INACTIVE);
        assertThat(scalar(protocol).asText()).isEqualTo("grpc");
        assertThat(protocol.comments())
                .anySatisfy(c -> {
                    assertThat(c.position()).isEqualTo(NodeComment.BEFORE);
                    assertThat(c.text()).contains("# Communication protocol");
                    assertThat(c.text()).contains("# Supported: grpc");
                    assertThat(c.text()).contains("# Default: grpc");
                    assertThat(c.text().split("\n", -1)).hasSize(3);
                });
    }

    @Test
    void readKeepsDecorativeBorderAsCommentNotInactiveNode() {
        String yaml = """
                ###########################################################################
                #                                                                         #
                #   Webserver configuration section                                       #
                #                                                                         #
                ###########################################################################
                server:
                  port: 9090
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        // Decorative box must NOT be parsed as an inactive node tree.
        ConfigNode server = find(result.fields(), "server");
        assertThat(server.status()).isEqualTo(ConfigNode.ACTIVE);
        // The box lines should be preserved as a single grouped before-comment
        // attached to server (or as a header orphan), not as a node.
        assertThat(allCommentText(result)).anySatisfy(t -> {
            assertThat(t).contains("Webserver configuration section");
            assertThat(t.split("\n", -1).length).isGreaterThanOrEqualTo(3);
        });
    }

    @Test
    void readGroupsMultiLineDocCommentAboveKeyIntoOneEntry() {
        String yaml = """
                # the http port the backend binds to
                # default is 9090; change to 80 in production
                # if you front it with nginx, use 9090
                server:
                  port: 9090
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        // All three lines collapse into one comment entry separated by \n.
        assertThat(allCommentText(result)).anySatisfy(t -> {
            assertThat(t).contains("the http port the backend binds to");
            assertThat(t).contains("default is 9090");
            assertThat(t).contains("if you front it with nginx");
            assertThat(t.split("\n", -1)).hasSize(3);
        });
    }

    @Test
    void readDoesNotMarkPlainSingleLineDocCommentAsInactive() {
        String yaml = """
                # User search base
                server:
                  port: 9090
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        // "User search base" looks superficially like "Key: Value" (it isn't),
        // but starts with an uppercase letter — must stay a doc comment, not
        // become an inactive node.
        assertThat(find(result.fields(), "User")).isNull();
        assertThat(find(result.fields(), "server").status()).isEqualTo(ConfigNode.ACTIVE);
    }

    @Test
    void readMarksTopLevelCommentedSectionAsInactive() {
        String yaml = """
                server:
                  port: 9090
                #spring:
                #  datasource:
                #    url: jdbc:test
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        ConfigNode spring = find(result.fields(), "spring");
        assertThat(spring).isNotNull();
        assertThat(spring.status()).isEqualTo(ConfigNode.INACTIVE);

        ConfigNode url = find(result.fields(), "spring.datasource.url");
        assertThat(url).isNotNull();
        assertThat(url.status()).isEqualTo(ConfigNode.INACTIVE);
        assertThat(scalar(url).asText()).isEqualTo("jdbc:test");
    }

    @Test
    void readAttachesInlineCommentToLeafNode() {
        String yaml = """
                server:
                  port: 9090   # default http port
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        ConfigNode port = find(result.fields(), "server.port");
        assertThat(port.comments())
                .anySatisfy(c -> {
                    assertThat(c.position()).isEqualTo(NodeComment.INLINE);
                    assertThat(c.text()).contains("default http port");
                });
    }

    @Test
    void readAttachesBeforeCommentNearTheKeyItPrecedes() {
        String yaml = """
                # comment above server
                server:
                  port: 9090
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        // The leading comment attaches either as a header orphan or as the
        // server node's "before" comment, depending on snakeyaml bookkeeping;
        // what matters is that it is preserved and not lost.
        assertThat(allCommentText(result)).anySatisfy(t -> assertThat(t).contains("comment above server"));
    }

    @Test
    void readGroupsAdjacentBlockCommentsIntoSingleEntry() {
        String yaml = """
                ###############################
                #   Configuration of tools    #
                ###############################
                server:
                  port: 9090
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        List<String> texts = allCommentText(result);
        assertThat(texts).anySatisfy(t -> {
            assertThat(t).contains("Configuration of tools");
            assertThat(t.split("\n", -1)).hasSize(3);
        });
    }

    @Test
    void readHandlesBundledApplicationYmlAndExposesKnownInactiveBlocks() throws java.io.IOException {
        // Real shape check against the file shipped with the project. Guards
        // against block-detection regressions that the synthetic fixtures
        // above might not catch.
        String yaml = java.nio.file.Files.readString(
                java.nio.file.Paths.get("src/main/resources/application.yml"));

        YamlConfigReader.ReadResult result = reader.read(yaml);

        // Active top-level keys must stay active.
        assertThat(find(result.fields(), "server").status()).isEqualTo(ConfigNode.ACTIVE);
        assertThat(find(result.fields(), "spring").status()).isEqualTo(ConfigNode.ACTIVE);
        assertThat(find(result.fields(), "opencelium").status()).isEqualTo(ConfigNode.ACTIVE);

        // The commented-out polyglot block is a child of opencelium and must
        // round-trip as an inactive subtree, not get lost as opaque comment.
        ConfigNode polyglot = find(result.fields(), "opencelium.polyglot");
        assertThat(polyglot).isNotNull();
        assertThat(polyglot.status()).isEqualTo(ConfigNode.INACTIVE);
        assertThat(polyglot.value()).isInstanceOf(List.class);

        ConfigNode enabled = find(result.fields(), "opencelium.polyglot.enabled");
        assertThat(enabled).isNotNull();
        assertThat(enabled.status()).isEqualTo(ConfigNode.INACTIVE);
        assertThat(scalar(enabled).asBoolean()).isFalse();
    }

    @Test
    void readExposesDoublyCommentedPropertyAsInactiveNode() {
        // A property deactivated twice — `# #    enabled: false` — must still
        // appear in the tree as inactive so the UI can target it for activation.
        String yaml = """
                spring:
                #  mail:
                #    opencelium:
                #      from: noreply@opencelium.io
                #  #    enabled: false
                #    host: smtp.gmail.com
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        ConfigNode enabled = find(result.fields(), "spring.mail.opencelium.enabled");
        assertThat(enabled).isNotNull();
        assertThat(enabled.status()).isEqualTo(ConfigNode.INACTIVE);
        assertThat(scalar(enabled).asBoolean()).isFalse();

        ConfigNode host = find(result.fields(), "spring.mail.host");
        assertThat(host).isNotNull();
        assertThat(host.status()).isEqualTo(ConfigNode.INACTIVE);
        assertThat(scalar(host).asText()).isEqualTo("smtp.gmail.com");
    }

    @Test
    void readReturnsEmptyTreeWhenYamlIsEmpty() {
        YamlConfigReader.ReadResult result = reader.read("");

        assertThat(result.fields()).isEmpty();
        assertThat(result.comments()).isEmpty();
    }

    @Test
    void readPreservesIntFloatBoolNullScalarTypes() {
        String yaml = """
                values:
                  count: 42
                  ratio: 0.5
                  enabled: true
                  missing: null
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        assertThat(scalar(find(result.fields(), "values.count")).isIntegralNumber()).isTrue();
        assertThat(scalar(find(result.fields(), "values.count")).asInt()).isEqualTo(42);
        assertThat(scalar(find(result.fields(), "values.ratio")).isFloatingPointNumber()).isTrue();
        assertThat(scalar(find(result.fields(), "values.ratio")).asDouble()).isEqualTo(0.5);
        assertThat(scalar(find(result.fields(), "values.enabled")).asBoolean()).isTrue();
        assertThat(scalar(find(result.fields(), "values.missing")).isNull()).isTrue();
    }

    @Test
    @DisplayName("mis-indented commented-out property → clear, located error naming the offending line")
    void readThrowsClearMessageWhenCommentedPropertyIsMisIndented() {
        // The commented `address` re-aligns to a deeper column than `port` once
        // its `#` is stripped, so snakeyaml reads it as a child of the scalar
        // `port` and fails. The user must be told exactly which line to fix.
        String yaml = """
                server:
                  port: 9090
                  #     address: 127.0.0.1
                """;

        assertThatThrownBy(() -> reader.read(yaml))
                .isInstanceOf(ApplicationConfigReadException.class)
                .hasMessageContaining("line 3")
                .hasMessageContaining("commented-out property")
                .hasMessageContaining("indent")
                .hasMessageContaining("#     address: 127.0.0.1");
    }

    @Test
    @DisplayName("malformed active YAML → generic but located syntax error, no false commented-out claim")
    void readThrowsLocatedGenericMessageWhenActiveYamlIsMalformed() {
        String yaml = """
                server:
                  port: 9090
                    address: 127.0.0.1
                """;

        assertThatThrownBy(() -> reader.read(yaml))
                .isInstanceOf(ApplicationConfigReadException.class)
                .hasMessageContaining("line 3")
                .hasMessageContaining("invalid YAML syntax")
                .hasMessageNotContaining("commented-out");
    }

    // ── helpers ──────────────────────────────────────────────────────────────

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

    private JsonNode scalar(ConfigNode node) {
        assertThat(node).isNotNull();
        assertThat(node.value()).isInstanceOf(JsonNode.class);
        return (JsonNode) node.value();
    }

    @SuppressWarnings("unchecked")
    private List<String> allCommentText(YamlConfigReader.ReadResult result) {
        List<String> out = new ArrayList<>();
        result.comments().forEach(c -> out.add(c.text()));
        collectNodeComments(result.fields(), out);
        return out;
    }

    @SuppressWarnings("unchecked")
    private void collectNodeComments(List<ConfigNode> fields, List<String> out) {
        for (ConfigNode node : fields) {
            node.comments().forEach(c -> out.add(c.text()));
            if (node.value() instanceof List<?> children) {
                collectNodeComments((List<ConfigNode>) children, out);
            }
        }
    }
}
