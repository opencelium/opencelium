package com.becon.opencelium.backend.resource.execution;

import com.becon.opencelium.backend.enums.execution.DataType;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeType;

import java.lang.reflect.Array;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


public class SchemaDTOUtil {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

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

    public static SchemaDTO fromObject(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof JsonNode jsonNode) {
            return fromJSONNode(jsonNode);
        }

        // Handle most frequently resolved reference types without
        // serialization or an intermediate JsonNode tree.
        if (value instanceof String string) {
            return primitive(DataType.STRING, string);
        }

        if (value instanceof Character character) {
            return primitive(DataType.STRING, character.toString());
        }

        if (value instanceof Boolean bool) {
            return primitive(DataType.BOOLEAN, bool.toString());
        }

        if (isIntegralNumber(value)) {
            return primitive(DataType.INTEGER, value.toString());
        }

        if (value instanceof BigDecimal decimal) {
            return fromBigDecimal(decimal);
        }

        if (isDecimalNumber(value)) {
            return primitive(DataType.NUMBER, value.toString());
        }

        if (value instanceof Map<?, ?> map) {
            return fromMap(map);
        }

        if (value instanceof Collection<?> collection) {
            return fromCollection(collection);
        }

        if (value.getClass().isArray()) {
            return fromArray(value);
        }

        // Fallback
        try {
            String jsonString = OBJECT_MAPPER.writeValueAsString(value);

            return fromJSONNode(OBJECT_MAPPER.readTree(jsonString));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Supplied Object could not be converted to SchemaDTO", e);
        }
    }

    public static String toJSON(SchemaDTO schema) {
        if (schema == null) {
            return null;
        } else if (schema.getType() == null) {
            throw new RuntimeException("Data type must be supplied to SchemaDTO");
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

    public static String toText(SchemaDTO schema) {
        if (schema == null) {
            return null;
        }

        return schema.getValue();
    }

    public static String toXML(SchemaDTO schema) {
        if (schema == null) {
            return null;
        }

        // root 'schema' should be an Object type and should have only one property
        DataType type = schema.getType();
        if (type == null) {
            throw new RuntimeException("DataType must be supplied to SchemaDTO");
        } else if (type != DataType.OBJECT || schema.getProperties() == null || schema.getProperties().size() != 1) {
            throw new RuntimeException("Couldn't find root element");
        }

        StringBuilder result = new StringBuilder();
        schema.getProperties().forEach((name, value) -> {
            writeTag(result, name, value);
        });

        return result.toString();
    }


    private static void writeTag(StringBuilder collector, String name, SchemaDTO value) {
        String tagName = getName(name, value);
        String attributes = getAttributes(value);
        String tagValue = getValue(name, value);

        if (value != null && value.getType() == DataType.ARRAY) {
            if (value.getXml() != null && value.getXml().isWrapped()) {
                // if 'wrapped' is true then wrap 'tagValue' with its name - 'tagName' then write
                collector.append("<").append(tagName).append(attributes).append(">").append(tagValue).append("</").append(tagName).append(">");
            } else {
                // if 'wrapped' is false then just write 'tagValue'
                collector.append(tagValue);
            }
        } else {
            // for any other cases write full tag
            collector.append("<").append(tagName).append(attributes).append(">").append(tagValue).append("</").append(tagName).append(">");
        }
    }

    private static String getName(String name, SchemaDTO value) {
        String result = name;

        if (value == null || value.getXml() == null) {
            return result;
        }

        XmlObjectDTO xml = value.getXml();
        // check if we have 'xml/name'
        if (xml.getName() != null) {
            result = xml.getName();
        }

        // check if we have 'xml/prefix'
        if (xml.getPrefix() != null) {
            result = xml.getPrefix() + ":" + result;
        }

        return result;
    }

    private static String getAttributes(SchemaDTO schema) {
        if (schema == null) {
            return "";
        }

        List<String> attributes = new ArrayList<>();
        attributes.add("");

        // check if we have 'xml/namespace'
        XmlObjectDTO xml = schema.getXml();
        if (xml != null && xml.getNamespace() != null) {
            String prefix = xml.getPrefix() == null ? "" : ":" + xml.getPrefix();

            attributes.add("xmlns" + prefix + "=\"" + xml.getNamespace() + "\"");
        }

        if (schema.getProperties() != null) {
            // add prefix to all attributes if exists
            String prefix = (xml == null || xml.getPrefix() == null) ? "" : xml.getPrefix() + ":";

            schema.getProperties().forEach((name, value) -> {
                if (value.getXml() != null && value.getXml().isAttribute()) {
                    String attributeName = getName(name, value);

                    attributes.add(prefix + attributeName + "=\"" + value.getValue() + "\"");
                }
            });

        }

        return String.join(" ", attributes);
    }

    private static String getValue(String name, SchemaDTO value) {
        if (value == null) {
            return "";
        }

        DataType type = value.getType();

        if (type.isPrimitive()) {
            return value.getValue() == null ? "" : value.getValue();
        }

        if (type == DataType.ARRAY) {
            if (value.getItems() == null) {
                return "";
            }

            String arrayName = getName(name, value);

            StringBuilder array = new StringBuilder();
            for (SchemaDTO item : value.getItems()) {
                writeTag(array, arrayName, item);
            }

            return array.toString();
        } else {
            if (value.getProperties() == null) {
                return "";
            }

            StringBuilder object = new StringBuilder();
            value.getProperties().forEach((propertyName, propertyValue) -> {
                // skip attributes
                if (propertyValue.getXml() == null || !propertyValue.getXml().isAttribute()) {
                    writeTag(object, propertyName, propertyValue);
                }
            });

            return object.toString();
        }
    }

    private static SchemaDTO fromJSONNode(JsonNode jsonNode) {
        if (jsonNode == null || jsonNode.isNull() || jsonNode.isMissingNode()) {
            return null;
        }

        JsonNodeType nodeType = jsonNode.getNodeType();

        if (nodeType == JsonNodeType.OBJECT) {
            SchemaDTO result = new SchemaDTO();
            result.setType(DataType.OBJECT);

            Map<String, SchemaDTO> properties = new LinkedHashMap<>();

            Iterator<Map.Entry<String, JsonNode>> fields = jsonNode.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();

                properties.put(field.getKey(), fromJSONNode(field.getValue()));
            }

            result.setProperties(properties);

            return result;
        }

        if (nodeType == JsonNodeType.ARRAY) {
            SchemaDTO result = new SchemaDTO();
            result.setType(DataType.ARRAY);

            List<SchemaDTO> items = new ArrayList<>();

            Iterator<JsonNode> elements = jsonNode.elements();

            while (elements.hasNext()) {
                JsonNode element = elements.next();

                items.add(fromJSONNode(element));
            }

            result.setItems(items);

            return result;
        }

        if (nodeType == JsonNodeType.STRING) {
            return primitive(DataType.STRING, jsonNode.asText());
        }

        if (nodeType == JsonNodeType.BOOLEAN) {
            return primitive(DataType.BOOLEAN, jsonNode.asText());
        }

        if (nodeType == JsonNodeType.NUMBER) {
            DataType type = jsonNode.isIntegralNumber()
                    ? DataType.INTEGER
                    : DataType.NUMBER;

            return primitive(type, jsonNode.asText());
        }

        if (nodeType == JsonNodeType.BINARY) {
            return primitive(DataType.STRING, jsonNode.asText());
        }

        // for BINARY, MISSING, NULL, POJO JsonNodeType types
        return null;
    }

    private static boolean isIntegralNumber(Object value) {
        return value instanceof Byte
                || value instanceof Short
                || value instanceof Integer
                || value instanceof Long
                || value instanceof BigInteger;
    }

    private static boolean isDecimalNumber(Object value) {
        return value instanceof Float || value instanceof Double;
    }

    private static SchemaDTO fromBigDecimal(BigDecimal value) {
        try {
            String normalized = OBJECT_MAPPER
                    .readTree(value.toString())
                    .asText();

            return primitive(DataType.NUMBER, normalized);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Supplied Object could not be converted to SchemaDTO", e);
        }
    }

    private static SchemaDTO fromMap(Map<?, ?> map) {
        SchemaDTO result = new SchemaDTO();
        result.setType(DataType.OBJECT);

        Map<String, SchemaDTO> properties = new LinkedHashMap<>(map.size());

        map.forEach((key, value) ->
                properties.put(
                        String.valueOf(key),
                        fromObject(value)
                )
        );

        result.setProperties(properties);

        return result;
    }

    private static SchemaDTO fromCollection(Collection<?> collection) {
        SchemaDTO result = new SchemaDTO();
        result.setType(DataType.ARRAY);

        List<SchemaDTO> items = new ArrayList<>(collection.size());

        for (Object element : collection) {
            items.add(fromObject(element));
        }

        result.setItems(items);

        return result;
    }

    private static SchemaDTO fromArray(Object array) {
        SchemaDTO result = new SchemaDTO();
        result.setType(DataType.ARRAY);

        int length = Array.getLength(array);
        List<SchemaDTO> items = new ArrayList<>(length);

        for (int i = 0; i < length; i++) {
            items.add(fromObject(Array.get(array, i)));
        }

        result.setItems(items);

        return result;
    }

    private static SchemaDTO primitive(DataType type, String value) {
        SchemaDTO result = new SchemaDTO();
        result.setType(type);
        result.setValue(value);

        return result;
    }
}
