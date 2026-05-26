/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.applicationConfig;

import com.becon.opencelium.backend.applicationConfig.service.YamlConfigWriter;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("YamlConfigWriter — deep-merge with comment and order preservation")
class YamlConfigWriterTest {

    private final YamlConfigWriter writer = new YamlConfigWriter();
    private final ObjectMapper json = new ObjectMapper();

    @Test
    void mergeReplacesScalarValueWhenPatchTargetsExistingKey() throws Exception {
        String original = """
                server:
                  port: 9090
                  address: 127.0.0.1
                """;
        JsonNode patch = json.readTree("""
                { "server": { "port": 8080 } }
                """);

        String merged = writer.merge(original, patch);

        assertThat(merged).contains("port: 8080");
        assertThat(merged).contains("address: 127.0.0.1");
    }

    @Test
    void mergePreservesInlineCommentWhenScalarReplaced() throws Exception {
        String original = """
                server:
                  port: 9090   # default http port
                """;
        JsonNode patch = json.readTree("""
                { "server": { "port": 8080 } }
                """);

        String merged = writer.merge(original, patch);

        assertThat(merged).contains("port: 8080");
        assertThat(merged).contains("# default http port");
    }

    @Test
    void mergePreservesBlockCommentAboveKeyWhenScalarReplaced() throws Exception {
        String original = """
                # the http port the backend binds to
                server:
                  port: 9090
                """;
        JsonNode patch = json.readTree("""
                { "server": { "port": 8080 } }
                """);

        String merged = writer.merge(original, patch);

        assertThat(merged).contains("# the http port the backend binds to");
        assertThat(merged).contains("port: 8080");
    }

    @Test
    void mergeLeavesUnrelatedSiblingKeysUntouched() throws Exception {
        String original = """
                server:
                  port: 9090
                  address: 127.0.0.1
                spring:
                  datasource:
                    username: root
                    password: root
                """;
        JsonNode patch = json.readTree("""
                { "spring": { "datasource": { "password": "newpass" } } }
                """);

        String merged = writer.merge(original, patch);

        assertThat(merged).contains("port: 9090");
        assertThat(merged).contains("address: 127.0.0.1");
        assertThat(merged).contains("username: root");
        assertThat(merged).contains("password: newpass");
    }

    @Test
    void mergePreservesKeyOrderWhenScalarReplaced() throws Exception {
        String original = """
                a: 1
                b: 2
                c: 3
                """;
        JsonNode patch = json.readTree("""
                { "b": 20 }
                """);

        String merged = writer.merge(original, patch);

        int idxA = merged.indexOf("a:");
        int idxB = merged.indexOf("b:");
        int idxC = merged.indexOf("c:");
        assertThat(idxA).isLessThan(idxB);
        assertThat(idxB).isLessThan(idxC);
        assertThat(merged).contains("b: 20");
    }

    @Test
    void mergeAppendsNewKeyAtParentBlockEndWhenKeyMissing() throws Exception {
        String original = """
                server:
                  port: 9090
                """;
        JsonNode patch = json.readTree("""
                { "server": { "newkey": "newval" } }
                """);

        String merged = writer.merge(original, patch);

        assertThat(merged).contains("port: 9090");
        assertThat(merged).contains("newkey: newval");
        assertThat(merged.indexOf("port: 9090")).isLessThan(merged.indexOf("newkey: newval"));
    }

    @Test
    void mergeKeepsNestedSiblingsWhenDeepPatchReplacesOneLeaf() throws Exception {
        String original = """
                opencelium:
                  token:
                    secret: abc
                    activity-time: 18000
                """;
        JsonNode patch = json.readTree("""
                { "opencelium": { "token": { "secret": "newsecret" } } }
                """);

        String merged = writer.merge(original, patch);

        assertThat(merged).contains("secret: newsecret");
        assertThat(merged).contains("activity-time: 18000");
    }

    @Test
    void mergeIsIdempotentWhenPatchIsEmpty() throws Exception {
        String original = """
                server:
                  port: 9090
                """;
        JsonNode patch = json.readTree("{}");

        String merged = writer.merge(original, patch);

        assertThat(merged).isEqualTo(original);
    }

    @Test
    void mergeReplacesArrayWhenPatchProvidesNewArray() throws Exception {
        String original = """
                cors:
                  origins:
                    - http://a
                    - http://b
                """;
        JsonNode patch = json.readTree("""
                { "cors": { "origins": ["http://c"] } }
                """);

        String merged = writer.merge(original, patch);

        assertThat(merged).contains("http://c");
        assertThat(merged).doesNotContain("http://a");
        assertThat(merged).doesNotContain("http://b");
    }
}
