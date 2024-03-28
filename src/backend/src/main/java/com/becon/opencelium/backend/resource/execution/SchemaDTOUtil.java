package com.becon.opencelium.backend.resource.execution;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeType;
import org.springframework.util.ObjectUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;
import java.util.stream.Collectors;

public class SchemaDTOUtil {

    public static SchemaDTO copy(SchemaDTO schema) {
        if (schema == null) {
            return null;
        }

        SchemaDTO result = new SchemaDTO();
        result.setType(schema.getType());
        result.setValue(schema.getValue());

        Map<String, SchemaDTO> properties = schema.getProperties();
        if (properties != null) {
            Map<String, SchemaDTO> temp = new HashMap<>();

            properties.forEach((s, schemaDTO) -> {
                temp.put(s, SchemaDTOUtil.copy(schemaDTO));
            });

            result.setProperties(temp);
        }

        List<SchemaDTO> items = schema.getItems();
        if (items != null) {
            List<SchemaDTO> temp = items.stream()
                    .map(SchemaDTOUtil::copy)
                    .collect(Collectors.toList());

            result.setItems(temp);
        }

        XmlObjectDTO xml = XmlObjectDTO.copy(schema.getXml());
        result.setXml(xml);

        return result;
    }

    public static String toJSON(SchemaDTO schema) {
        if (schema == null) {
            return null;
        } else if (schema.getType() == null) {
            throw new IllegalStateException("Data type must be supplied to SchemaDTO");
        }

        DataType type = schema.getType();

        if (type == DataType.OBJECT) {
            Map<String, SchemaDTO> properties = schema.getProperties();

            // if 'properties' is null then just return null
            if (properties == null) {
                return null;
            }

            // loop through each property and convert it to JSON string recursively
            String object = properties.entrySet().stream()
                    .map(entry -> "\"" + entry.getKey() + "\": " + SchemaDTOUtil.toJSON(entry.getValue()))
                    .collect(Collectors.joining(", "));

            return "{" + object + "}";
        }

        if (type == DataType.ARRAY) {
            List<SchemaDTO> items = schema.getItems();

            // if items is null then just return null
            if (items == null) {
                return null;
            }

            // loop through each item and convert it to JSON recursively
            String array = items.stream()
                    .map(SchemaDTOUtil::toJSON)
                    .collect(Collectors.joining(", "));

            return "[" + array + "]";
        }

        String value = schema.getValue();

        // at this point only primitives are left
        // if value is null for a primitive then return null
        if (value == null) {
            return null;
        }

        // for STRING primitive we need to add double quote
        return type == DataType.STRING ? "\"" + value + "\"" : value;
    }

    public static String toXML(SchemaDTO schema) {
        if (schema == null) {
            return null;
        } else if (schema.getType() == null) {
            throw new IllegalStateException("Data type must be supplied to SchemaDTO");
        }

        DataType type = schema.getType();

        // handle unusual cases:
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
        if (schema == null) {
            return null;
        }

        return schema.getValue();
    }

    public static SchemaDTO fromObject(Object value) {
        if (value == null) {
            return null;
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            String jsonString = mapper.writeValueAsString(value);

            return fromJSONNode(mapper.readTree(jsonString));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Supplied Object could not be converted to SchemaDTO", e);
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
