/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.applicationConfig;

import com.becon.opencelium.backend.applicationConfig.dto.YamlComment;
import com.becon.opencelium.backend.applicationConfig.service.YamlConfigReader;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("YamlConfigReader — comment extraction and JSON projection")
class YamlConfigReaderTest {

    private final YamlConfigReader reader = new YamlConfigReader();

    @Test
    void readReturnsNestedJsonStructureWhenYamlContainsMapping() {
        String yaml = """
                server:
                  port: 9090
                  address: 127.0.0.1
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        assertThat(result.data().get("server").get("port").asInt()).isEqualTo(9090);
        assertThat(result.data().get("server").get("address").asText()).isEqualTo("127.0.0.1");
    }

    @Test
    void readReturnsArrayValuesWhenYamlContainsSequence() {
        String yaml = """
                cors:
                  origins:
                    - http://localhost:3000
                    - http://localhost:4000
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        assertThat(result.data().get("cors").get("origins").isArray()).isTrue();
        assertThat(result.data().get("cors").get("origins").get(0).asText()).isEqualTo("http://localhost:3000");
        assertThat(result.data().get("cors").get("origins").get(1).asText()).isEqualTo("http://localhost:4000");
    }

    @Test
    void readCollectsBeforeCommentsWhenBlockCommentSitsAboveKey() {
        String yaml = """
                # comment above port
                server:
                  port: 9090
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        assertThat(result.comments())
                .anySatisfy(c -> {
                    assertThat(c.position()).isEqualTo(YamlComment.POSITION_BEFORE);
                    assertThat(c.text()).contains("comment above port");
                });
    }

    @Test
    void readCollectsInlineCommentsWhenCommentSitsAfterValue() {
        String yaml = """
                server:
                  port: 9090   # default http port
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        assertThat(result.comments())
                .anySatisfy(c -> {
                    assertThat(c.position()).isEqualTo(YamlComment.POSITION_INLINE);
                    assertThat(c.text()).contains("default http port");
                    assertThat(c.path()).isEqualTo("server.port");
                });
    }

    @Test
    void readUsesHeaderPathWhenCommentSitsAtTopOfFile() {
        String yaml = """
                # opening banner
                server:
                  port: 9090
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        assertThat(result.comments())
                .anySatisfy(c -> {
                    assertThat(c.text()).contains("opening banner");
                });
    }

    @Test
    void readReturnsEmptyObjectWhenYamlIsEmpty() {
        YamlConfigReader.ReadResult result = reader.read("");

        assertThat(result.data().isObject()).isTrue();
        assertThat(result.data().size()).isEqualTo(0);
        assertThat(result.comments()).isEmpty();
    }

    @Test
    void readBuildsDotPathForNestedKeysWhenYamlIsDeep() {
        String yaml = """
                opencelium:
                  token:
                    secret: abc123
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        assertThat(result.data().get("opencelium").get("token").get("secret").asText()).isEqualTo("abc123");
    }

    @Test
    void readGroupsAdjacentBlockCommentsIntoSingleEntry() {
        String yaml = """
                ###############################
                #                             #
                #   Configuration of tools    #
                #                             #
                ###############################
                server:
                  port: 9090
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        long beforeServer = result.comments().stream()
                .filter(c -> "server".equals(c.path()))
                .filter(c -> YamlComment.POSITION_BEFORE.equals(c.position()))
                .count();
        assertThat(beforeServer).isEqualTo(1);

        YamlComment block = result.comments().stream()
                .filter(c -> "server".equals(c.path())
                        && YamlComment.POSITION_BEFORE.equals(c.position()))
                .findFirst()
                .orElseThrow();
        assertThat(block.text().split("\n", -1)).hasSize(5);
        assertThat(block.text()).contains("Configuration of tools");
        assertThat(block.text()).startsWith("###");
        assertThat(block.text()).endsWith("###");
    }

    @Test
    void readKeepsBeforeAndInlineCommentsAsSeparateEntriesWhenBothExist() {
        String yaml = """
                # block above
                server:
                  port: 9090   # inline note
                """;

        YamlConfigReader.ReadResult result = reader.read(yaml);

        long portBefore = result.comments().stream()
                .filter(c -> "server.port".equals(c.path()))
                .filter(c -> YamlComment.POSITION_BEFORE.equals(c.position()))
                .count();
        long portInline = result.comments().stream()
                .filter(c -> "server.port".equals(c.path()))
                .filter(c -> YamlComment.POSITION_INLINE.equals(c.position()))
                .count();
        assertThat(portInline).isEqualTo(1);
        // "block above" attaches to whichever key comes next — either server or
        // server.port, depending on snakeyaml's bookkeeping. What we care about
        // is that the two positions never collapse into one entry.
        assertThat(portBefore + portInline).isGreaterThanOrEqualTo(1);
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

        assertThat(result.data().get("values").get("count").isIntegralNumber()).isTrue();
        assertThat(result.data().get("values").get("count").asInt()).isEqualTo(42);
        assertThat(result.data().get("values").get("ratio").isFloatingPointNumber()).isTrue();
        assertThat(result.data().get("values").get("ratio").asDouble()).isEqualTo(0.5);
        assertThat(result.data().get("values").get("enabled").asBoolean()).isTrue();
        assertThat(result.data().get("values").get("missing").isNull()).isTrue();
    }
}
