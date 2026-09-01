/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.appYml.service;

import com.becon.opencelium.backend.appYml.dto.ApplicationConfigResponse;
import com.becon.opencelium.backend.appYml.dto.ConfigNode;
import com.becon.opencelium.backend.exception.ApplicationConfigReadException;
import com.becon.opencelium.backend.exception.ApplicationConfigValidationException;
import com.becon.opencelium.backend.exception.ApplicationConfigWriteException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.snakeyaml.engine.v2.api.LoadSettings;
import org.snakeyaml.engine.v2.api.lowlevel.Compose;
import org.snakeyaml.engine.v2.nodes.Node;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ApplicationConfigServiceImpl implements ApplicationConfigService {

    private final YamlConfigReader reader;
    private final YamlConfigWriter writer;
    private final AtomicFileWriter fileWriter;
    private final String configuredPath;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ApplicationConfigServiceImpl(
            YamlConfigReader reader,
            YamlConfigWriter writer,
            AtomicFileWriter fileWriter,
            @Value("${opencelium.config.file-path:./application.yml}") String configuredPath
    ) {
        this.reader = reader;
        this.writer = writer;
        this.fileWriter = fileWriter;
        this.configuredPath = configuredPath;
    }

    @Override
    public ApplicationConfigResponse read() {
        String content = readContent();
        YamlConfigReader.ReadResult result = reader.read(content);
        return new ApplicationConfigResponse(result.fields(), result.comments());
    }

    @Override
    public void patch(JsonNode fields) {
        if (fields == null || !fields.isArray()) {
            throw new ApplicationConfigValidationException("Patch payload 'fields' must be a JSON array");
        }

        PatchPlan plan = new PatchPlan(
                objectMapper.createObjectNode(), new ArrayList<>(), new ArrayList<>());
        for (JsonNode field : fields) {
            collectField(field, plan);
        }

        Path target = resolveWritablePath();
        String original = readContent();

        PatchPlan effective = validateInvariant(original, plan);

        // Apply enables first so subsequent merge/disable operations see the
        // newly-active lines instead of their stale `#`-prefixed forms.
        String merged = original;
        if (!effective.activatePaths.isEmpty()) {
            merged = writer.uncomment(merged, effective.activatePaths);
        }
        if (!effective.valueTree.isEmpty()) {
            merged = writer.merge(merged, effective.valueTree);
        }
        if (!effective.disablePaths.isEmpty()) {
            merged = writer.commentOut(merged, effective.disablePaths);
        }

        verifyParseable(merged);

        fileWriter.write(target, merged);
    }

    /**
     * Re-parses the merged text exactly as the Spring config loader would, and
     * refuses the patch if it no longer forms valid YAML.
     */
    private void verifyParseable(String merged) {
        LoadSettings settings = LoadSettings.builder().build();
        try {
            // composeAllFromString is lazy: it parses only as the Iterable is
            // advanced. The loop below is what performs the parse — without it
            // this method silently accepts anything.
            for (Node ignored : new Compose(settings).composeAllFromString(merged)) {
                // no-op: parsing is the assertion
            }
        } catch (Exception e) {
            throw new ApplicationConfigWriteException(
                    "Refusing to save: applying this change would produce an invalid "
                            + "application.yml, so it was not written and the file on disk is "
                            + "unchanged. " + YamlShadow.describeParseFailure(merged, e), e);
        }
    }

    // ── Patch payload parsing ────────────────────────────────────────────────

    private void collectField(JsonNode node, PatchPlan plan) {
        if (node == null || !node.isObject() || !node.hasNonNull("path") || !node.get("path").isTextual()) {
            throw new ApplicationConfigValidationException("Each field must be an object with a 'path' string");
        }
        String path = node.get("path").asText();
        String status = node.hasNonNull("status") ? node.get("status").asText() : null;

        if (ConfigNode.INACTIVE.equals(status)) {
            plan.disablePaths.add(path);
            return; // disabling a node disables its whole subtree
        }
        if (status != null && !ConfigNode.ACTIVE.equals(status)) {
            throw new ApplicationConfigValidationException(
                    "Unknown status '" + status + "' for path '" + path + "'");
        }
        if (ConfigNode.ACTIVE.equals(status)) {
            plan.activatePaths.add(path);
        }

        JsonNode value = node.get("value");
        if (value != null && isContainerArray(value)) {
            for (JsonNode child : value) {
                collectField(child, plan);
            }
        } else if (value != null) {
            putAtPath(plan.valueTree, path, value);
        }
    }

    private boolean isContainerArray(JsonNode value) {
        if (!value.isArray() || value.isEmpty()) {
            return false;
        }
        for (JsonNode element : value) {
            if (!element.isObject() || !element.has("path")) {
                return false;
            }
        }
        return true;
    }

    private void putAtPath(ObjectNode root, String dottedPath, JsonNode value) {
        String[] segments = dottedPath.split("\\.");
        ObjectNode current = root;
        for (int i = 0; i < segments.length; i++) {
            if (segments[i].contains("[")) {
                throw new ApplicationConfigValidationException(
                        "Array-index paths are not supported for value edits: " + dottedPath);
            }
            if (i == segments.length - 1) {
                current.set(segments[i], value);
            } else {
                JsonNode next = current.get(segments[i]);
                if (next instanceof ObjectNode existing) {
                    current = existing;
                } else {
                    ObjectNode created = objectMapper.createObjectNode();
                    current.set(segments[i], created);
                    current = created;
                }
            }
        }
    }

    // ── Active-container invariant ───────────────────────────────────────────

    /**
     * Validates the patch against the on-disk tree and returns a plan with
     * already-correct-status entries filtered out (so a `status:"active"` on
     * an already-active path is a no-op, not an uncomment that would error).
     */
    private PatchPlan validateInvariant(String original, PatchPlan plan) {
        List<ConfigNode> tree = reader.read(original).fields();
        Map<String, Boolean> onDiskActive = new LinkedHashMap<>();
        List<String> containers = new ArrayList<>();
        List<String> leaves = new ArrayList<>();
        walkTree(tree, onDiskActive, containers, leaves);

        for (String disabled : plan.disablePaths) {
            if (!onDiskActive.containsKey(disabled)) {
                throw new ApplicationConfigValidationException(
                        "Cannot disable unknown path '" + disabled + "'");
            }
        }
        for (String activated : plan.activatePaths) {
            if (!onDiskActive.containsKey(activated)) {
                throw new ApplicationConfigValidationException(
                        "Cannot enable unknown path '" + activated + "'");
            }
        }

        // Drop disables of already-inactive paths and activates of already-active
        // paths — both are no-ops, so we don't want them flowing into the writer
        // (which would re-comment / fail to find the YAML node).
        List<String> effectiveDisables = new ArrayList<>();
        for (String p : plan.disablePaths) {
            if (Boolean.TRUE.equals(onDiskActive.get(p))) {
                effectiveDisables.add(p);
            }
        }
        // Two cascade rules combine to build the effective activate set:
        //
        //  - Cascade DOWN from each explicitly-listed path: activating a
        //    container enables every on-disk descendant. (User's rule:
        //    "If user activates parent then all children should be activated.")
        //
        //  - Cascade UP from each path: activating a deep leaf auto-adds the
        //    inactive ancestor chain — but ONLY the ancestors, not their
        //    siblings. So `{path: "websocket.ssl.key-store-password"}`
        //    enables `key-store-password` plus its parent key lines, leaving
        //    other ssl children commented.
        //
        // The two cascades are applied in order so a parent activation
        // expands to descendants first; then any added path's ancestors are
        // walked up.
        Set<String> activateSet = new LinkedHashSet<>();
        for (String p : plan.activatePaths) {
            // Keep the activate if it has any real effect: either the path is
            // inactive on disk, or this same patch would otherwise disable it
            // via a parent cascade. Without the second clause, a self-
            // contradicting payload like `{disable spring.mail, activate
            // spring.mail.host}` would silently filter the activate away
            // and let the disable win.
            boolean isInactiveOnDisk = Boolean.FALSE.equals(onDiskActive.get(p));
            boolean wouldBeDisabledByPatch = isDisabled(p, effectiveDisables);
            if (isInactiveOnDisk || wouldBeDisabledByPatch) {
                activateSet.add(p);
            }
        }
        for (String p : new ArrayList<>(activateSet)) {
            for (String candidate : onDiskActive.keySet()) {
                if (candidate.startsWith(p + ".")
                        && Boolean.FALSE.equals(onDiskActive.get(candidate))) {
                    activateSet.add(candidate);
                }
            }
        }
        for (String p : new ArrayList<>(activateSet)) {
            int dot = p.lastIndexOf('.');
            while (dot > 0) {
                String ancestor = p.substring(0, dot);
                if (isDisabled(ancestor, effectiveDisables)) {
                    throw new ApplicationConfigValidationException(
                            "Cannot activate '" + p + "' while ancestor '" + ancestor
                                    + "' is being disabled in the same patch.");
                }
                if (Boolean.FALSE.equals(onDiskActive.get(ancestor))) {
                    activateSet.add(ancestor);
                }
                dot = ancestor.lastIndexOf('.');
            }
        }
        List<String> effectiveActivates = new ArrayList<>(activateSet);

        List<String> addedLeaves = new ArrayList<>();
        collectLeafPaths(plan.valueTree, "", addedLeaves);

        // Cascade UP on disable: if a disable leaves an active container
        // without any remaining active child, auto-disable that container,
        // and repeat up the chain. User's rule: "If I deactivate a child and
        // there are no more active siblings then also deactivate the parent.
        // And if the parent's ancestor has no other active subtree, comment
        // it too."
        //
        // The loop runs until the disable set is closed under the rule. Each
        // pass walks containers deepest-first so a freshly-emptied container
        // can in turn empty its parent in the same iteration.
        List<String> sortedDeepest = new ArrayList<>(containers);
        sortedDeepest.sort(Comparator.comparingInt(this::depth).reversed());

        boolean changed = true;
        while (changed) {
            changed = false;
            for (String container : sortedDeepest) {
                if (effectiveDisables.contains(container)) {
                    continue;
                }
                if (isDisabled(container, effectiveDisables)) {
                    continue; // already inside a disabled subtree
                }
                if (!Boolean.TRUE.equals(onDiskActive.get(container))) {
                    continue; // already inactive on disk
                }

                boolean hasAnyLeaf = leaves.stream().anyMatch(l -> l.startsWith(container + "."))
                        || addedLeaves.stream().anyMatch(l -> l.startsWith(container + "."));
                if (!hasAnyLeaf) {
                    continue; // empty container, leave it alone
                }

                boolean hasActiveLeaf = leaves.stream().anyMatch(l ->
                                l.startsWith(container + ".")
                                        && isLeafActiveAfter(l, onDiskActive, effectiveActivates, effectiveDisables))
                        || addedLeaves.stream().anyMatch(l -> l.startsWith(container + "."));
                if (hasActiveLeaf) {
                    continue;
                }

                // Container would be left empty — but if the caller explicitly
                // activates it in the same patch, that's a self-contradiction.
                if (effectiveActivates.contains(container)) {
                    throw new ApplicationConfigValidationException(
                            "Cannot activate '" + container
                                    + "' while disabling all its descendants in the same patch.");
                }
                effectiveDisables.add(container);
                changed = true;
            }
        }

        return new PatchPlan(plan.valueTree, effectiveDisables, effectiveActivates);
    }

    private boolean isLeafActiveAfter(String leaf, Map<String, Boolean> onDiskActive,
                                      List<String> activates, List<String> disables) {
        if (isDisabled(leaf, disables)) {
            return false;
        }
        // Activation is explicit-only: enabling a container does not make its
        // children count as active for the invariant, even though the writer's
        // line-range strip will physically uncomment them. This mirrors the
        // spec's requirement that the caller spell out at least one child.
        if (activates.contains(leaf)) {
            return true;
        }
        return Boolean.TRUE.equals(onDiskActive.get(leaf));
    }

    private int depth(String path) {
        int dots = 0;
        for (int i = 0; i < path.length(); i++) {
            if (path.charAt(i) == '.') dots++;
        }
        return dots;
    }

    private boolean isDisabled(String path, List<String> disablePaths) {
        for (String disabled : disablePaths) {
            if (path.equals(disabled) || path.startsWith(disabled + ".")) {
                return true;
            }
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private void walkTree(List<ConfigNode> nodes, Map<String, Boolean> active,
                          List<String> containers, List<String> leaves) {
        for (ConfigNode node : nodes) {
            active.put(node.path(), ConfigNode.ACTIVE.equals(node.status()));
            Object value = node.value();
            if (value instanceof List<?> children) {
                containers.add(node.path());
                walkTree((List<ConfigNode>) children, active, containers, leaves);
            } else {
                leaves.add(node.path());
            }
        }
    }

    private void collectLeafPaths(JsonNode node, String prefix, List<String> out) {
        if (node.isObject()) {
            node.fields().forEachRemaining(e ->
                    collectLeafPaths(e.getValue(), prefix.isEmpty() ? e.getKey() : prefix + "." + e.getKey(), out));
        } else {
            out.add(prefix);
        }
    }

    // ── File access ──────────────────────────────────────────────────────────

    private String readContent() {
        Path filesystemPath = Paths.get(configuredPath);
        if (Files.exists(filesystemPath)) {
            try {
                return Files.readString(filesystemPath, StandardCharsets.UTF_8);
            } catch (IOException e) {
                throw new ApplicationConfigReadException("Failed to read " + filesystemPath, e);
            }
        }
        try {
            return new String(
                    new ClassPathResource("application.yml").getInputStream().readAllBytes(),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new ApplicationConfigReadException(
                    "Configuration file not found at " + configuredPath + " or on classpath", e
            );
        }
    }

    private Path resolveWritablePath() {
        Path filesystemPath = Paths.get(configuredPath);
        if (!Files.exists(filesystemPath)) {
            throw new ApplicationConfigWriteException(
                    "Cannot write to " + configuredPath + ": file does not exist on disk. "
                            + "Configure opencelium.config.file-path to point at a writable copy."
            );
        }
        return filesystemPath;
    }

    private record PatchPlan(ObjectNode valueTree, List<String> disablePaths, List<String> activatePaths) {
    }
}
