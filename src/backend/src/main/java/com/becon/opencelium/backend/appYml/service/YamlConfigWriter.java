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

import com.becon.opencelium.backend.exception.ApplicationConfigWriteException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.snakeyaml.engine.v2.api.Dump;
import org.snakeyaml.engine.v2.api.DumpSettings;
import org.snakeyaml.engine.v2.api.LoadSettings;
import org.snakeyaml.engine.v2.api.lowlevel.Compose;
import org.snakeyaml.engine.v2.common.FlowStyle;
import org.snakeyaml.engine.v2.common.ScalarStyle;
import org.snakeyaml.engine.v2.nodes.MappingNode;
import org.snakeyaml.engine.v2.nodes.Node;
import org.snakeyaml.engine.v2.nodes.NodeTuple;
import org.snakeyaml.engine.v2.nodes.ScalarNode;
import org.snakeyaml.engine.v2.nodes.SequenceNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class YamlConfigWriter {

    public String merge(String originalYaml, JsonNode patch) {
        if (patch == null || patch.isNull()) {
            return originalYaml;
        }
        if (!patch.isObject()) {
            throw new ApplicationConfigWriteException("Patch root must be a JSON object");
        }

        LoadSettings loadSettings = LoadSettings.builder().setParseComments(true).build();
        Optional<Node> rootOpt;
        try {
            rootOpt = new Compose(loadSettings).composeString(originalYaml);
        } catch (Exception e) {
            throw new ApplicationConfigWriteException(YamlShadow.describeParseFailure(originalYaml, e), e);
        }
        if (rootOpt.isEmpty() || !(rootOpt.get() instanceof MappingNode rootMapping)) {
            throw new ApplicationConfigWriteException("application.yml must have a mapping root");
        }

        List<String> lines = new ArrayList<>(Arrays.asList(originalYaml.split("\n", -1)));
        List<Edit> edits = new ArrayList<>();

        planMappingMerge(rootMapping, (ObjectNode) patch, 0, edits);

        edits.sort(Comparator.comparingInt(Edit::sortKey).reversed());
        for (Edit edit : edits) {
            edit.apply(lines);
        }

        return String.join("\n", lines);
    }

    /**
     * Enables (uncomments) each given dotted path in place by stripping every
     * leading {@code #} marker from that path's <em>key line only</em>.
     * Container key lines are stripped, but their child lines stay commented
     * unless the caller also passes those child paths — cascading is the
     * caller's responsibility (see {@code ApplicationConfigServiceImpl}).
     *
     * <p>All leading {@code #}s on an anchor line are stripped, so a
     * doubly-commented property like {@code "  #  #    enabled: false"}
     * becomes fully active in one PATCH. Non-anchor lines (inner doc
     * comments, decorative borders) are left untouched. Throws if the path
     * doesn't exist as an inactive node in the file.</p>
     */
    public String uncomment(String originalYaml, List<String> paths) {
        if (paths == null || paths.isEmpty()) {
            return originalYaml;
        }

        YamlShadow.Result built = YamlShadow.build(originalYaml);

        LoadSettings loadSettings = LoadSettings.builder().setParseComments(true).build();
        Optional<Node> rootOpt;
        try {
            rootOpt = new Compose(loadSettings).composeString(built.shadow());
        } catch (Exception e) {
            throw new ApplicationConfigWriteException(YamlShadow.describeParseFailure(originalYaml, e), e);
        }
        if (rootOpt.isEmpty() || !(rootOpt.get() instanceof MappingNode rootMapping)) {
            throw new ApplicationConfigWriteException("application.yml must have a mapping root");
        }

        String[] originalLines = originalYaml.split("\n", -1);
        java.util.BitSet linesToUncomment = new java.util.BitSet(originalLines.length);
        for (String path : paths) {
            NodeTuple tuple = findTuple(rootMapping, path).orElseThrow(() ->
                    new ApplicationConfigWriteException("Cannot enable unknown path: " + path));
            // Strip only the key line — caller controls cascade by listing
            // every descendant path it wants enabled.
            linesToUncomment.set(markLine(tuple.getKeyNode()));
        }

        List<String> lines = new ArrayList<>(Arrays.asList(originalLines));
        for (int i = linesToUncomment.nextSetBit(0); i >= 0; i = linesToUncomment.nextSetBit(i + 1)) {
            if (i >= lines.size()) {
                break;
            }
            String line = lines.get(i);
            if (YamlShadow.isAnchor(line)) {
                lines.set(i, YamlShadow.stripAllLeadingHashes(line));
            }
        }
        return String.join("\n", lines);
    }

    /**
     * Disables (comments out) each given dotted path in place by prefixing
     * {@code # } to every line of the node's block, from its key line down to
     * the last line of its value. Blank and already-commented lines are left
     * untouched. Surrounding comments and formatting are preserved. Throws if a
     * path does not exist as an active node on disk.
     */
    public String commentOut(String originalYaml, List<String> paths) {
        if (paths == null || paths.isEmpty()) {
            return originalYaml;
        }

        LoadSettings loadSettings = LoadSettings.builder().setParseComments(true).build();
        Optional<Node> rootOpt;
        try {
            rootOpt = new Compose(loadSettings).composeString(originalYaml);
        } catch (Exception e) {
            throw new ApplicationConfigWriteException(YamlShadow.describeParseFailure(originalYaml, e), e);
        }
        if (rootOpt.isEmpty() || !(rootOpt.get() instanceof MappingNode rootMapping)) {
            throw new ApplicationConfigWriteException("application.yml must have a mapping root");
        }

        List<String> lines = new ArrayList<>(Arrays.asList(originalYaml.split("\n", -1)));
        List<Edit> edits = new ArrayList<>();
        for (String path : paths) {
            NodeTuple tuple = findTuple(rootMapping, path).orElseThrow(() ->
                    new ApplicationConfigWriteException("Cannot disable unknown path: " + path));
            int start = markLine(tuple.getKeyNode());
            int end = lastContentLine(tuple.getValueNode());
            edits.add(new CommentLineRange(start, end));
        }

        edits.sort(Comparator.comparingInt(Edit::sortKey).reversed());
        for (Edit edit : edits) {
            edit.apply(lines);
        }
        return String.join("\n", lines);
    }

    private Optional<NodeTuple> findTuple(MappingNode mapping, String dottedPath) {
        String[] segments = dottedPath.split("\\.");
        MappingNode current = mapping;
        NodeTuple found = null;
        for (int i = 0; i < segments.length; i++) {
            found = null;
            for (NodeTuple tuple : current.getValue()) {
                if (tuple.getKeyNode() instanceof ScalarNode s && s.getValue().equals(segments[i])) {
                    found = tuple;
                    break;
                }
            }
            if (found == null) {
                return Optional.empty();
            }
            if (i < segments.length - 1) {
                if (found.getValueNode() instanceof MappingNode nested) {
                    current = nested;
                } else {
                    return Optional.empty();
                }
            }
        }
        return Optional.ofNullable(found);
    }

    private int lastContentLine(Node node) {
        int max = markLine(node);
        if (node instanceof MappingNode mapping) {
            for (NodeTuple tuple : mapping.getValue()) {
                max = Math.max(max, lastContentLine(tuple.getKeyNode()));
                max = Math.max(max, lastContentLine(tuple.getValueNode()));
            }
        } else if (node instanceof SequenceNode sequence) {
            for (Node item : sequence.getValue()) {
                max = Math.max(max, lastContentLine(item));
            }
        }
        return max;
    }

    private void planMappingMerge(MappingNode mapping, ObjectNode patch, int parentChildIndent, List<Edit> edits) {
        Map<String, NodeTuple> existing = new LinkedHashMap<>();
        for (NodeTuple t : mapping.getValue()) {
            existing.put(((ScalarNode) t.getKeyNode()).getValue(), t);
        }
        int childIndent = !mapping.getValue().isEmpty()
                ? markColumn(mapping.getValue().get(0).getKeyNode())
                : parentChildIndent;

        Iterator<String> fields = patch.fieldNames();
        while (fields.hasNext()) {
            String key = fields.next();
            JsonNode pv = patch.get(key);
            NodeTuple existingTuple = existing.get(key);
            if (existingTuple == null) {
                int insertAfter = mappingInsertLine(mapping);
                edits.add(new InsertAfter(insertAfter, renderEntry(key, pv, childIndent)));
            } else {
                Node value = existingTuple.getValueNode();
                if (pv.isObject() && value instanceof MappingNode nested && !nested.getValue().isEmpty()) {
                    planMappingMerge(nested, (ObjectNode) pv, childIndent + 2, edits);
                } else {
                    planReplace(existingTuple, pv, edits);
                }
            }
        }
    }

    private void planReplace(NodeTuple tuple, JsonNode newValue, List<Edit> edits) {
        ScalarNode keyScalar = (ScalarNode) tuple.getKeyNode();
        Node value = tuple.getValueNode();
        int keyStartLine = markLine(keyScalar);
        int keyIndent = markColumn(keyScalar);

        boolean newIsContainer = newValue.isObject() || newValue.isArray();
        boolean oldIsScalar = value instanceof ScalarNode;
        boolean oldIsEmpty = value instanceof ScalarNode s && s.getValue().isEmpty();

        if (oldIsEmpty) {
            // A key with no value (`username:`, `url: `) has no text on disk to
            // overwrite, and snakeyaml gives its empty scalar degenerate marks:
            // a zero-width point immediately after the `:` — or, when a trailing
            // comment follows the colon, a point on the *next* line entirely.
            // Splicing at either would produce `username:Test123` or swallow the following line
            if (!newIsContainer) {
                edits.add(new FillEmptyValue(
                        markEndLine(keyScalar), markEndColumn(keyScalar), emitScalar(newValue)));
                return;
            }
            edits.add(new ReplaceLineRange(
                    keyStartLine, keyStartLine, renderEntry(keyScalar.getValue(), newValue, keyIndent)));
            return;
        }

        int valueStartLine = markLine(value);
        int valueEndLine = markEndLine(value);
        int valueStartCol = markColumn(value);
        int valueEndCol = markEndColumn(value);

        if (oldIsScalar && !newIsContainer && valueStartLine == valueEndLine && valueStartLine == keyStartLine) {
            String emitted = emitScalar(newValue);
            edits.add(new ReplaceInLine(valueStartLine, valueStartCol, valueEndCol, emitted));
            return;
        }

        List<String> rendered = renderEntry(keyScalar.getValue(), newValue, keyIndent);
        edits.add(new ReplaceLineRange(keyStartLine, valueEndLine, rendered));
    }

    private int mappingInsertLine(MappingNode mapping) {
        List<NodeTuple> tuples = mapping.getValue();
        if (tuples.isEmpty()) {
            return markEndLine(mapping);
        }
        NodeTuple last = tuples.get(tuples.size() - 1);
        return markEndLine(last.getValueNode());
    }

    private List<String> renderEntry(String key, JsonNode value, int indent) {
        Map<String, Object> wrapper = new LinkedHashMap<>();
        wrapper.put(key, toJava(value));
        String dumped = stripTrailingNewline(dump(wrapper));
        String pad = " ".repeat(indent);
        String[] parts = dumped.split("\n", -1);
        List<String> out = new ArrayList<>(parts.length);
        for (String part : parts) {
            out.add(part.isEmpty() ? part : pad + part);
        }
        return out;
    }

    private String emitScalar(JsonNode value) {
        return stripTrailingNewline(dump(toJava(value)));
    }

    private String dump(Object value) {
        DumpSettings settings = DumpSettings.builder()
                .setDefaultFlowStyle(FlowStyle.BLOCK)
                .setDefaultScalarStyle(ScalarStyle.PLAIN)
                .setSplitLines(false)
                .build();
        return new Dump(settings).dumpToString(value);
    }

    private static String stripTrailingNewline(String text) {
        return text.endsWith("\n") ? text.substring(0, text.length() - 1) : text;
    }

    private Object toJava(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isObject()) {
            Map<String, Object> map = new LinkedHashMap<>();
            node.fields().forEachRemaining(e -> map.put(e.getKey(), toJava(e.getValue())));
            return map;
        }
        if (node.isArray()) {
            List<Object> list = new ArrayList<>(node.size());
            node.forEach(c -> list.add(toJava(c)));
            return list;
        }
        if (node.isBoolean()) {
            return node.booleanValue();
        }
        if (node.isInt() || node.isLong()) {
            return node.longValue();
        }
        if (node.isFloatingPointNumber()) {
            return node.doubleValue();
        }
        return node.asText();
    }

    private static int markLine(Node n) {
        return n.getStartMark().orElseThrow(YamlConfigWriter::missingMark).getLine();
    }

    private static int markEndLine(Node n) {
        return n.getEndMark().orElseThrow(YamlConfigWriter::missingMark).getLine();
    }

    private static int markColumn(Node n) {
        return n.getStartMark().orElseThrow(YamlConfigWriter::missingMark).getColumn();
    }

    private static int markEndColumn(Node n) {
        return n.getEndMark().orElseThrow(YamlConfigWriter::missingMark).getColumn();
    }

    private static ApplicationConfigWriteException missingMark() {
        return new ApplicationConfigWriteException("YAML node has no source position");
    }

    private sealed interface Edit
            permits ReplaceInLine, FillEmptyValue, ReplaceLineRange, InsertAfter, CommentLineRange {
        int sortKey();

        void apply(List<String> lines);
    }

    private record CommentLineRange(int startLine, int endLine) implements Edit {
        @Override
        public int sortKey() {
            return startLine;
        }

        @Override
        public void apply(List<String> lines) {
            // Prepend `#` at column 0 — matches the bundled-file convention
            // (`#  ssl:` etc.) and makes activate/deactivate round-trip stable.
            // The companion uncommenter strips exactly one leading `#`, so the
            // two ops are inverses: a deactivate-then-activate cycle returns
            // the line to its starting bytes.
            int from = Math.max(0, startLine);
            int to = Math.min(endLine, lines.size() - 1);
            for (int i = from; i <= to; i++) {
                String line = lines.get(i);
                int indent = 0;
                while (indent < line.length() && line.charAt(indent) == ' ') {
                    indent++;
                }
                if (indent >= line.length()) {
                    continue; // blank line
                }
                if (line.charAt(indent) == '#') {
                    continue; // already commented
                }
                lines.set(i, "#" + line);
            }
        }
    }

    private record ReplaceInLine(int line, int startCol, int endCol, String newText) implements Edit {
        @Override
        public int sortKey() {
            return line;
        }

        @Override
        public void apply(List<String> lines) {
            String original = lines.get(line);
            int safeEnd = Math.min(endCol, original.length());
            int safeStart = Math.min(startCol, safeEnd);
            String replaced = original.substring(0, safeStart) + newText + original.substring(safeEnd);
            lines.set(line, replaced);
        }
    }

    /**
     * Writes a value into a key that currently has none. Unlike
     * {@link ReplaceInLine} this does not trust the value node's marks — an
     * empty scalar has none worth trusting — but re-finds the {@code :} from
     * the end of the key and rebuilds the line around it, guaranteeing exactly
     * one space between colon and value. Any whitespace already sitting after
     * the colon is collapsed into that single space, and a trailing comment is
     * preserved with a space of its own.
     */
    private record FillEmptyValue(int line, int keyEndCol, String newText) implements Edit {
        @Override
        public int sortKey() {
            return line;
        }

        @Override
        public void apply(List<String> lines) {
            if (line < 0 || line >= lines.size()) {
                return;
            }
            String original = lines.get(line);
            int colon = original.indexOf(':', Math.min(Math.max(keyEndCol, 0), original.length()));
            if (colon < 0) {
                throw new ApplicationConfigWriteException(
                        "Cannot write value: no ':' found on line " + (line + 1) + ": " + original);
            }
            int tail = colon + 1;
            while (tail < original.length()
                    && (original.charAt(tail) == ' ' || original.charAt(tail) == '\t')) {
                tail++;
            }
            String rest = original.substring(tail);
            lines.set(line, original.substring(0, colon + 1) + " " + newText
                    + (rest.isEmpty() ? "" : " " + rest));
        }
    }

    private record ReplaceLineRange(int startLine, int endLine, List<String> newLines) implements Edit {
        @Override
        public int sortKey() {
            return startLine;
        }

        @Override
        public void apply(List<String> lines) {
            int from = Math.min(startLine, lines.size() - 1);
            int to = Math.min(endLine, lines.size() - 1);
            for (int i = to; i >= from; i--) {
                lines.remove(i);
            }
            lines.addAll(from, newLines);
        }
    }

    private record InsertAfter(int line, List<String> newLines) implements Edit {
        @Override
        public int sortKey() {
            return line;
        }

        @Override
        public void apply(List<String> lines) {
            int idx = Math.min(line + 1, lines.size());
            lines.addAll(idx, newLines);
        }
    }
}
