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

import com.becon.opencelium.backend.applicationConfig.dto.YamlComment;
import com.becon.opencelium.backend.exception.ApplicationConfigReadException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.BooleanNode;
import com.fasterxml.jackson.databind.node.DoubleNode;
import com.fasterxml.jackson.databind.node.LongNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class YamlConfigReader {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public ReadResult read(String yamlText) {
        LoadSettings settings = LoadSettings.builder().setParseComments(true).build();
        Optional<Node> rootOpt;
        try {
            rootOpt = new Compose(settings).composeString(yamlText);
        } catch (Exception e) {
            throw new ApplicationConfigReadException("Failed to parse application.yml", e);
        }

        List<YamlComment> comments = new ArrayList<>();
        if (rootOpt.isEmpty()) {
            return new ReadResult(objectMapper.createObjectNode(), comments);
        }

        Node root = rootOpt.get();
        collect(root.getBlockComments(), YamlComment.HEADER_PATH, YamlComment.POSITION_BEFORE, comments);
        JsonNode data = nodeToJson(root, "", comments);
        collect(root.getInLineComments(), YamlComment.FOOTER_PATH, YamlComment.POSITION_INLINE, comments);
        collect(root.getEndComments(), YamlComment.FOOTER_PATH, YamlComment.POSITION_AFTER, comments);
        return new ReadResult(data, groupByPathAndPosition(comments));
    }

    /**
     * Merges entries that share the same {@code (path, position)} into a single
     * comment whose {@code text} is the original lines joined with {@code \n}.
     * Multi-line block comments (e.g. ASCII-art section banners) become one
     * entry instead of one entry per physical line, which is what the UI needs
     * to render them as a single block.
     */
    private List<YamlComment> groupByPathAndPosition(List<YamlComment> raw) {
        Map<String, YamlComment> grouped = new LinkedHashMap<>();
        for (YamlComment c : raw) {
            String key = c.path() + "|" + c.position();
            YamlComment existing = grouped.get(key);
            if (existing == null) {
                grouped.put(key, c);
            } else {
                grouped.put(key, new YamlComment(
                        existing.path(),
                        existing.position(),
                        existing.text() + "\n" + c.text()
                ));
            }
        }
        return new ArrayList<>(grouped.values());
    }

    private JsonNode nodeToJson(Node node, String path, List<YamlComment> comments) {
        if (node instanceof MappingNode mapping) {
            ObjectNode obj = objectMapper.createObjectNode();
            for (NodeTuple tuple : mapping.getValue()) {
                Node keyNode = tuple.getKeyNode();
                Node valueNode = tuple.getValueNode();
                String key = scalarString(keyNode);
                String childPath = path.isEmpty() ? key : path + "." + key;

                collect(keyNode.getBlockComments(), childPath, YamlComment.POSITION_BEFORE, comments);
                collect(valueNode.getBlockComments(), childPath, YamlComment.POSITION_BEFORE, comments);
                collect(keyNode.getInLineComments(), childPath, YamlComment.POSITION_INLINE, comments);
                collect(valueNode.getInLineComments(), childPath, YamlComment.POSITION_INLINE, comments);
                collect(keyNode.getEndComments(), childPath, YamlComment.POSITION_AFTER, comments);
                collect(valueNode.getEndComments(), childPath, YamlComment.POSITION_AFTER, comments);

                obj.set(key, nodeToJson(valueNode, childPath, comments));
            }
            return obj;
        }
        if (node instanceof SequenceNode sequence) {
            ArrayNode arr = objectMapper.createArrayNode();
            int i = 0;
            for (Node item : sequence.getValue()) {
                String childPath = path + "[" + i + "]";
                collect(item.getBlockComments(), childPath, YamlComment.POSITION_BEFORE, comments);
                collect(item.getInLineComments(), childPath, YamlComment.POSITION_INLINE, comments);
                collect(item.getEndComments(), childPath, YamlComment.POSITION_AFTER, comments);
                arr.add(nodeToJson(item, childPath, comments));
                i++;
            }
            return arr;
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

    private void collect(List<CommentLine> lines, String path, String position, List<YamlComment> out) {
        if (lines == null) {
            return;
        }
        for (CommentLine line : lines) {
            if (line.getCommentType() == CommentType.BLANK_LINE) {
                continue;
            }
            out.add(new YamlComment(path, position, line.getValue()));
        }
    }

    public record ReadResult(JsonNode data, List<YamlComment> comments) {
    }
}
