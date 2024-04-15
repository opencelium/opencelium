package com.becon.opencelium.backend.resource.execution;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeType;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
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
