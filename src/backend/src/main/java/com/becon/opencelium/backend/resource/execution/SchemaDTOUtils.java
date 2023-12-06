package com.becon.opencelium.backend.resource.execution;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeType;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ObjectUtils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;
import java.util.stream.Collectors;

public class SchemaDTOUtils {

    private static final String DEFAULT_STRING = "";
    private static final Integer DEFAULT_INTEGER = 0;
    private static final Double DEFAULT_NUMBER = 0.0;
    private static final Boolean DEFAULT_BOOLEAN = false;

    public static String toJSON(SchemaDTO schema) {
        if (schema == null || schema.getType() == null) {
            throw new IllegalStateException("schema and data type must not be null");
        }

        DataType type = schema.getType();

        if (type == DataType.OBJECT) {
            Map<String, SchemaDTO> properties = schema.getProperties();

            // if properties is empty or null then stop recursion by returning 'empty' JSON object
            if (CollectionUtils.isEmpty(properties)) {
                return "{}";
            }

            // loop through each property and convert it to JSON string recursively
            String object = properties.entrySet().stream()
                    .map(entry -> "\"" + entry.getKey() + "\": " + toJSON(entry.getValue()))
                    .collect(Collectors.joining(", "));

            return "{" + object + "}";
        }

        if (type == DataType.ARRAY) {
            List<SchemaDTO> items = schema.getItems();

            // if items is empty or null then stop recursion by returning 'empty' JSON array
            if (CollectionUtils.isEmpty(items)) {
                return "[]";
            }

            // loop through each item and convert it to JSON recursively
            String array = items.stream()
                    .map(SchemaDTOUtils::toJSON)
                    .collect(Collectors.joining(", "));

            return "[" + array + "]";
        }

        String value = schema.getValue();

        // if value is empty or null for a primitive then return DEFAULT value
        if (ObjectUtils.isEmpty(value)) {
            if (type == DataType.STRING) {
                return "\"" + DEFAULT_STRING + "\"";
            }

            if (type == DataType.BOOLEAN) {
                return DEFAULT_BOOLEAN.toString();
            }

            if (type == DataType.NUMBER) {
                return DEFAULT_NUMBER.toString();
            }

            if (type == DataType.INTEGER) {
                return DEFAULT_INTEGER.toString();
            }
        }

        // for STRING primitive we need to add double quote
        return type == DataType.STRING ? "\"" + value + "\"" : value;
    }

    public static String toXML(SchemaDTO schema) {
        if (schema == null || schema.getType() == null) {
            throw new IllegalStateException("schema and data type must not be null");
        }

        // handle unusual cases:
        DataType type = schema.getType();

        // case 1. schema with type STRING at the top level:
        if (type == DataType.STRING) {
            String value = schema.getValue();

            // if value is null or empty then return root
            if (ObjectUtils.isEmpty(value)) {
                return tagWriter("root", value);
            }

            // if value is not null then work with string as array
            StringBuilder result = new StringBuilder();
            for (char ch : value.toCharArray()) {
                result.append(tagWriter("element", String.valueOf(ch)));
            }

            return tagWriter("root", result.toString());
        }

        // case 2. schema with types INTEGER, NUMBER, BOOLEAN at the top level:
        if (type == DataType.INTEGER || type == DataType.NUMBER || type == DataType.BOOLEAN) {
            return tagWriter("root", null);
        }

        return toXML("root", true, schema);
    }

    public static String toText(SchemaDTO schema) {
        return ObjectUtils.isEmpty(schema) ? "" : schema.getValue();
    }

    public static SchemaDTO fromJSON(String jsonString) {
        try {
            return fromJSONNode(new ObjectMapper().readTree(jsonString));
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    public static SchemaDTO fromXML(String xmlString) {
        try {
            // first convert 'xmlString' to JsonNode by using XmlMapper.
            // Drawback: it converts NUMBER and BOOLEAN to STRING
            return fromJSONNode(new XmlMapper().readTree(xmlString.getBytes()));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private static String toXML(String tag, boolean topLayer, SchemaDTO schema) {
        DataType type = schema.getType();

        if (type == DataType.OBJECT) {
            Map<String, SchemaDTO> properties = schema.getProperties();

            // for empty object we have two cases:
            if (ObjectUtils.isEmpty(properties)) {
                // case 1. for top level object return root
                if (topLayer) {
                    return tagWriter("root", null);
                }

                // case 2. for inner object return self-closing tag
                return "<" + tag + " />";
            }

            // for object with body convert all fields to XML and join them then wrap inside given tag
            StringJoiner object = new StringJoiner("");
            for (Map.Entry<String, SchemaDTO> entry : properties.entrySet()) {
                String xml = toXML(entry.getKey(), false, entry.getValue());
                object.add(xml);
            }

            return tagWriter(tag, object.toString());
        }

        if (type == DataType.ARRAY) {
            List<SchemaDTO> items = schema.getItems();

            // for empty array we have two cases:
            if (ObjectUtils.isEmpty(items)) {
                // case 1. for top level array return root
                if (topLayer) {
                    return tagWriter("root", null);
                }

                // case 2. for inner array return empty string
                return "";
            }

            // for non-empty top layer array
            if (topLayer) {
                StringJoiner array = new StringJoiner("");
                for (int index = 0; index < items.size(); index++) {
                    SchemaDTO item = items.get(index);
                    // if items' type is object we need its 'index' as tag, otherwise tag is 'element'
                    String currentTag = item.getType() == DataType.OBJECT ? String.valueOf(index) : "element";

                    String xml = toXML(currentTag, false, item);
                    array.add(xml);
                }

                return tagWriter(tag, array.toString());
            }

            // for not top layer arrays, tag is inherited
            StringJoiner array = new StringJoiner("");
            for (SchemaDTO item : items) {
                // item inherits its tag from wrapped type
                String xml = toXML(tag, false, item);
                array.add(xml);
            }

            return array.toString();
        }

        // for primitive types we have two cases (for this always topLevel = false):
        // value = null  : ... => <tag />
        // value != null : ... => <tag>value</tag>
        String value = schema.getValue();

        return value == null ? "<" + tag + " />" : tagWriter(tag, value);
    }

    private static String tagWriter(String tag, String value) {
        if (value == null) return tagWriter(tag, "");

        return "<" + tag + ">" + value + "</" + tag + ">";
    }

    private static SchemaDTO fromJSONNode(JsonNode jsonNode) {
        JsonNodeType nodeType = jsonNode.getNodeType();

        SchemaDTO result = new SchemaDTO();

        if (nodeType == JsonNodeType.OBJECT) {
            result.setType(DataType.OBJECT);

            Map<String, SchemaDTO> properties = new HashMap<>();

            Iterator<Map.Entry<String, JsonNode>> fields = jsonNode.fields();

            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();

                properties.put(field.getKey(), fromJSONNode(field.getValue()));
            }

            result.setProperties(properties);
        } else if (nodeType == JsonNodeType.ARRAY) {
            result.setType(DataType.ARRAY);

            List<SchemaDTO> items = new ArrayList<>();

            Iterator<JsonNode> elements = jsonNode.elements();

            while (elements.hasNext()) {
                JsonNode element = elements.next();

                items.add(fromJSONNode(element));
            }

            result.setItems(items);
        } else if (nodeType == JsonNodeType.BOOLEAN) {
            result.setType(DataType.BOOLEAN);
            result.setValue(jsonNode.asText());
        } else if (nodeType == JsonNodeType.STRING) {
            result.setType(DataType.STRING);
            result.setValue(jsonNode.asText());
        } else if (nodeType == JsonNodeType.NUMBER) {
            String value = jsonNode.asText();

            if (value.contains(".")) {
                result.setType(DataType.NUMBER);
            } else {
                result.setType(DataType.INTEGER);
            }

            result.setValue(value);
        } else {
            // for BINARY, MISSING, NULL, POJO JsonNodeType types
            result = null;
        }

        return result;
    }
}
