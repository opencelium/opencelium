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

package com.becon.opencelium.backend.applicationConfig.service;

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
            throw new ApplicationConfigWriteException("Failed to parse application.yml", e);
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
        int valueStartLine = markLine(value);
        int valueEndLine = markEndLine(value);
        int valueStartCol = markColumn(value);
        int valueEndCol = markEndColumn(value);

        boolean newIsContainer = newValue.isObject() || newValue.isArray();
        boolean oldIsScalar = value instanceof ScalarNode;

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

    private sealed interface Edit permits ReplaceInLine, ReplaceLineRange, InsertAfter {
        int sortKey();

        void apply(List<String> lines);
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
