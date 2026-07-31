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

import com.becon.opencelium.backend.appYml.dto.ConfigNode;
import com.becon.opencelium.backend.appYml.dto.NodeComment;
import com.becon.opencelium.backend.exception.ApplicationConfigReadException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.BooleanNode;
import com.fasterxml.jackson.databind.node.DoubleNode;
import com.fasterxml.jackson.databind.node.LongNode;
import com.fasterxml.jackson.databind.node.TextNode;
import org.snakeyaml.engine.v2.api.LoadSettings;
import org.snakeyaml.engine.v2.api.lowlevel.Compose;
import org.snakeyaml.engine.v2.comments.CommentLine;
import org.snakeyaml.engine.v2.comments.CommentType;
import org.snakeyaml.engine.v2.nodes.MappingNode;
import org.snakeyaml.engine.v2.nodes.Node;
import org.snakeyaml.engine.v2.nodes.NodeTuple;
import org.snakeyaml.engine.v2.nodes.ScalarNode;
import org.snakeyaml.engine.v2.nodes.SequenceNode;
import org.snakeyaml.engine.v2.nodes.Tag;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.BitSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Parses {@code application.yml} into a tree of {@link ConfigNode}s including
 * commented-out (inactive) config. {@link YamlShadow} produces a version of
 * the file with the outer {@code #} markers stripped from every anchor line;
 * snakeyaml parses that shadow, and any node whose source line came from an
 * inactive block is marked {@link ConfigNode#INACTIVE}.
 *
 * <p>Three comment shapes are preserved:</p>
 * <ul>
 *   <li><b>Decorative {@code ###...} boxes</b> are kept as one multi-line
 *       block comment attached to the following node (or as a header/footer
 *       orphan).</li>
 *   <li><b>Single-line {@code # text}</b> above a key attaches as a
 *       {@code before} comment on that node.</li>
 *   <li><b>Multi-line {@code #} blocks</b> above a key are grouped into one
 *       {@code before} entry, joined with {@code \n}. Inside an inactive
 *       block, inner doc comments written as {@code #  # text} keep their
 *       inner {@code #} in the comment text (the &quot;double&nbsp;#&quot;
 *       case), since the shadow leaves non-anchor lines untouched.</li>
 * </ul>
 */
@Component
public class YamlConfigReader {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public ReadResult read(String yamlText) {
        YamlShadow.Result built = YamlShadow.build(yamlText);

        LoadSettings settings = LoadSettings.builder().setParseComments(true).build();
        Optional<Node> rootOpt;
        try {
            rootOpt = new Compose(settings).composeString(built.shadow());
        } catch (Exception e) {
            throw new ApplicationConfigReadException(YamlShadow.describeParseFailure(yamlText, e), e);
        }

        List<ConfigNode> fields = new ArrayList<>();
        List<NodeComment> orphans = new ArrayList<>();
        if (rootOpt.isEmpty()) {
            return new ReadResult(fields, orphans);
        }

        Node root = rootOpt.get();
        BitSet inactiveLines = built.inactiveLines();
        groupedComment(NodeComment.HEADER, root.getBlockComments()).ifPresent(orphans::add);
        if (root instanceof MappingNode mapping) {
            for (NodeTuple tuple : mapping.getValue()) {
                fields.add(toNode(tuple, "", inactiveLines));
            }
        }
        List<CommentLine> footer = new ArrayList<>();
        if (root.getInLineComments() != null) {
            footer.addAll(root.getInLineComments());
        }
        if (root.getEndComments() != null) {
            footer.addAll(root.getEndComments());
        }
        groupedComment(NodeComment.FOOTER, footer).ifPresent(orphans::add);

        return new ReadResult(fields, orphans);
    }

    private ConfigNode toNode(NodeTuple tuple, String parentPath, BitSet inactiveLines) {
        Node keyNode = tuple.getKeyNode();
        Node valueNode = tuple.getValueNode();
        String key = scalarString(keyNode);
        String path = parentPath.isEmpty() ? key : parentPath + "." + key;

        int keyLine = keyNode.getStartMark().orElseThrow(() ->
                new ApplicationConfigReadException("YAML node has no source position")).getLine();
        String status = inactiveLines.get(keyLine) ? ConfigNode.INACTIVE : ConfigNode.ACTIVE;

        List<NodeComment> comments = buildComments(keyNode, valueNode);
        Object value = toValue(valueNode, path, inactiveLines);
        return new ConfigNode(key, path, status, value, comments);
    }

    private List<NodeComment> buildComments(Node keyNode, Node valueNode) {
        Map<String, List<String>> byPosition = new LinkedHashMap<>();
        collect(byPosition, NodeComment.BEFORE, keyNode.getBlockComments());
        collect(byPosition, NodeComment.BEFORE, valueNode.getBlockComments());
        collect(byPosition, NodeComment.INLINE, keyNode.getInLineComments());
        collect(byPosition, NodeComment.INLINE, valueNode.getInLineComments());
        collect(byPosition, NodeComment.AFTER, keyNode.getEndComments());
        collect(byPosition, NodeComment.AFTER, valueNode.getEndComments());

        List<NodeComment> out = new ArrayList<>();
        for (Map.Entry<String, List<String>> e : byPosition.entrySet()) {
            out.add(new NodeComment(e.getKey(), String.join("\n", e.getValue())));
        }
        return out;
    }

    private Object toValue(Node node, String path, BitSet inactiveLines) {
        if (node instanceof MappingNode mapping) {
            List<ConfigNode> children = new ArrayList<>();
            for (NodeTuple tuple : mapping.getValue()) {
                children.add(toNode(tuple, path, inactiveLines));
            }
            return children;
        }
        if (node instanceof SequenceNode sequence) {
            boolean allScalars = sequence.getValue().stream().allMatch(n -> n instanceof ScalarNode);
            if (allScalars) {
                ArrayNode arr = objectMapper.createArrayNode();
                for (Node item : sequence.getValue()) {
                    arr.add(scalarToJson((ScalarNode) item));
                }
                return arr;
            }
            List<ConfigNode> children = new ArrayList<>();
            int idx = 0;
            for (Node item : sequence.getValue()) {
                String childPath = path + "[" + idx + "]";
                int itemLine = item.getStartMark().orElseThrow(() ->
                        new ApplicationConfigReadException("YAML node has no source position")).getLine();
                String itemStatus = inactiveLines.get(itemLine) ? ConfigNode.INACTIVE : ConfigNode.ACTIVE;
                children.add(new ConfigNode(
                        "[" + idx + "]", childPath, itemStatus,
                        toValue(item, childPath, inactiveLines), List.of()));
                idx++;
            }
            return children;
        }
        if (node instanceof ScalarNode scalar) {
            return scalarToJson(scalar);
        }
        return objectMapper.nullNode();
    }

    private JsonNode scalarToJson(ScalarNode scalar) {
        String value = scalar.getValue();
        Tag tag = scalar.getTag();
        if (Tag.NULL.equals(tag)) {
            return objectMapper.nullNode();
        }
        if (Tag.BOOL.equals(tag)) {
            return BooleanNode.valueOf(Boolean.parseBoolean(value));
        }
        if (Tag.INT.equals(tag)) {
            try {
                return new LongNode(Long.parseLong(value));
            } catch (NumberFormatException ignored) {
                return TextNode.valueOf(value);
            }
        }
        if (Tag.FLOAT.equals(tag)) {
            try {
                return new DoubleNode(Double.parseDouble(value));
            } catch (NumberFormatException ignored) {
                return TextNode.valueOf(value);
            }
        }
        return TextNode.valueOf(value);
    }

    private String scalarString(Node node) {
        if (node instanceof ScalarNode scalar) {
            return scalar.getValue();
        }
        throw new ApplicationConfigReadException(
                "Only scalar keys are supported in application.yml, found " + node.getNodeType()
        );
    }

    private void collect(Map<String, List<String>> byPosition, String position, List<CommentLine> lines) {
        if (lines == null) {
            return;
        }
        for (CommentLine line : lines) {
            if (line.getCommentType() == CommentType.BLANK_LINE) {
                continue;
            }
            byPosition.computeIfAbsent(position, k -> new ArrayList<>()).add(line.getValue());
        }
    }

    private Optional<NodeComment> groupedComment(String position, List<CommentLine> lines) {
        if (lines == null) {
            return Optional.empty();
        }
        List<String> texts = new ArrayList<>();
        for (CommentLine line : lines) {
            if (line.getCommentType() == CommentType.BLANK_LINE) {
                continue;
            }
            texts.add(line.getValue());
        }
        if (texts.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(new NodeComment(position, String.join("\n", texts)));
    }

    public record ReadResult(List<ConfigNode> fields, List<NodeComment> comments) {
    }
}
