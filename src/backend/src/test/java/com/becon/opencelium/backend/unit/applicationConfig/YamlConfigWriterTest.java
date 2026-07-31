/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.applicationConfig;

import com.becon.opencelium.backend.appYml.service.YamlConfigWriter;
import com.becon.opencelium.backend.exception.ApplicationConfigWriteException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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

    // ── commentOut (disable) ──────────────────────────────────────────────────

    @Test
    void commentOutDisablesLeafWhilePreservingSiblingsWhenPathIsScalar() {
        String original = """
                server:
                  port: 9090
                  address: 127.0.0.1
                """;

        String result = writer.commentOut(original, List.of("server.address"));

        // The `#` is prepended at column 0 — the bundled-file convention. The
        // line's original indent is preserved as the gap between `#` and key.
        assertThat(result).contains("port: 9090");
        assertThat(result).contains("#  address: 127.0.0.1");
        assertThat(result).doesNotContain("\n  address: 127.0.0.1");
    }

    @Test
    void commentOutDisablesWholeBlockWhenPathIsContainer() {
        String original = """
                server:
                  port: 9090
                  ssl:
                    enabled: true
                    key-store-type: PKCS12
                """;

        String result = writer.commentOut(original, List.of("server.ssl"));

        assertThat(result).contains("port: 9090");
        assertThat(result).contains("#  ssl:");
        assertThat(result).contains("#    enabled: true");
        assertThat(result).contains("#    key-store-type: PKCS12");
    }

    @Test
    void commentOutPreservesSurroundingCommentsWhenDisabling() {
        String original = """
                server:
                  # the bind port
                  port: 9090
                  address: 127.0.0.1
                """;

        String result = writer.commentOut(original, List.of("server.address"));

        assertThat(result).contains("# the bind port");
        assertThat(result).contains("port: 9090");
        assertThat(result).contains("#  address: 127.0.0.1");
    }

    @Test
    void commentOutAndUncommentAreInversesAcrossARoundTrip() {
        // Activate → deactivate → activate must return the same bytes for the
        // inactive block. Earlier impl prepended `# ` (2 chars), uncomment
        // stripped only `#` (1 char), so each cycle drifted the indent by 1
        // and eventually broke YAML parsing for nested blocks.
        String pristine = """
                websocket:
                  endpoint: /websocket
                #  ssl:
                #    enabled: true
                #    key-store-type: PKCS12
                """;

        String activated = writer.uncomment(pristine, List.of("websocket.ssl"));
        String reDeactivated = writer.commentOut(activated, List.of("websocket.ssl"));
        String reActivated = writer.uncomment(reDeactivated, List.of("websocket.ssl"));

        assertThat(reDeactivated).isEqualTo(pristine);
        assertThat(reActivated).isEqualTo(activated);
    }

    @Test
    void commentOutReturnsOriginalWhenNoPathsGiven() {
        String original = """
                server:
                  port: 9090
                """;

        assertThat(writer.commentOut(original, List.of())).isEqualTo(original);
    }

    // ── uncomment (enable) ────────────────────────────────────────────────────

    @Test
    void uncommentEnablesInactiveLeafWhilePreservingSiblings() {
        String original = """
                server:
                  port: 9090
                #  address: 127.0.0.1
                """;

        String result = writer.uncomment(original, List.of("server.address"));

        assertThat(result).contains("port: 9090");
        assertThat(result).contains("address: 127.0.0.1");
        assertThat(result).doesNotContain("# address: 127.0.0.1");
        assertThat(result).doesNotContain("#  address: 127.0.0.1");
    }

    @Test
    void uncommentEnablesEachListedPathButLeavesUnlistedSiblingsCommented() {
        // Writer strips ONLY the key lines of paths it's given — no automatic
        // cascade to children. The service is responsible for expanding a
        // container activation into its descendants.
        String original = """
                server:
                  port: 9090
                #  ssl:
                #    enabled: true
                #    key-store-type: PKCS12
                """;

        String result = writer.uncomment(original,
                List.of("server.ssl", "server.ssl.enabled"));

        // ssl and enabled listed → uncommented.
        assertThat(result).contains("\n  ssl:");
        assertThat(result).contains("\n    enabled: true");
        // key-store-type NOT listed → stays commented.
        assertThat(result).contains("#    key-store-type: PKCS12");
    }

    @Test
    void uncommentStripsBothHashesFromDoublyCommentedProperty() {
        // `# # ...` is doubly inactive — one activation must remove both #s.
        String original = """
                spring:
                #  mail:
                #    opencelium:
                #      from: noreply@opencelium.io
                #  #    enabled: false
                #    host: smtp.gmail.com
                """;

        String result = writer.uncomment(
                original, List.of("spring.mail.opencelium.enabled"));

        assertThat(result).contains("    enabled: false");
        assertThat(result).doesNotContain("#    enabled: false");
        assertThat(result).doesNotContain("#  #    enabled: false");
        // Sibling lines are untouched — they were not in the request.
        assertThat(result).contains("#  mail:");
        assertThat(result).contains("#    host: smtp.gmail.com");
    }

    @Test
    void uncommentLeavesInnerDocCommentsIntact() {
        // The `# LDAP server URL` line inside the block is documentation, not
        // a YAML property — enabling the surrounding block must keep it
        // exactly as-is.
        String original = """
                spring:
                #  security:
                #    ldap:
                #      # LDAP server URL
                #      urls: ldap://localhost:7389
                """;

        String result = writer.uncomment(original,
                List.of("spring.security", "spring.security.ldap",
                        "spring.security.ldap.urls"));

        assertThat(result).contains("\n  security:");
        assertThat(result).contains("\n    ldap:");
        assertThat(result).contains("\n      urls: ldap://localhost:7389");
        // Inner doc comment preserved verbatim.
        assertThat(result).contains("#      # LDAP server URL");
    }

    @Test
    void uncommentReturnsOriginalWhenNoPathsGiven() {
        String original = """
                server:
                #  port: 9090
                """;

        assertThat(writer.uncomment(original, List.of())).isEqualTo(original);
    }

    @Test
    void uncommentThrowsWhenPathDoesNotExist() {
        String original = """
                server:
                  port: 9090
                """;

        assertThatThrownBy(() -> writer.uncomment(original, List.of("server.missing")))
                .isInstanceOf(ApplicationConfigWriteException.class);
    }

    @Test
    void commentOutThrowsWhenPathDoesNotExist() {
        String original = """
                server:
                  port: 9090
                """;

        assertThatThrownBy(() -> writer.commentOut(original, List.of("server.missing")))
                .isInstanceOf(ApplicationConfigWriteException.class);
    }
}
