package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.enums.execution.DataType;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;
import com.becon.opencelium.backend.resource.execution.XmlObjectDTO;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

public class SchemaDTOFixture {
    public static SchemaDTO string(String value) {
        return primitive(DataType.STRING, value);
    }

    public static SchemaDTO integer(String value) {
        return primitive(DataType.INTEGER, value);
    }

    public static SchemaDTO number(String value) {
        return primitive(DataType.NUMBER, value);
    }

    public static SchemaDTO bool(String value) {
        return primitive(DataType.BOOLEAN, value);
    }

    /** A text value sent as written, like the query of a GraphQL body. */
    public static SchemaDTO literal(String value) {
        SchemaDTO schema = string(value);
        schema.setLiteral(true);

        return schema;
    }

    public static SchemaDTO primitive(DataType type, String value) {
        SchemaDTO schema = new SchemaDTO();
        schema.setType(type);
        schema.setValue(value);

        return schema;
    }

    public static SchemaDTO array(SchemaDTO... items) {
        SchemaDTO schema = new SchemaDTO();
        schema.setType(DataType.ARRAY);
        schema.setItems(Arrays.asList(items));

        return schema;
    }

    public static SchemaDTO object(Object... entries) {
        if (entries.length % 2 != 0) {
            throw new IllegalArgumentException("Object schema entries must contain key/value pairs");
        }

        Map<String, SchemaDTO> properties = new LinkedHashMap<>();

        for (int i = 0; i < entries.length; i += 2) {
            properties.put((String) entries[i], (SchemaDTO) entries[i + 1]);
        }

        SchemaDTO schema = new SchemaDTO();
        schema.setType(DataType.OBJECT);
        schema.setProperties(properties);

        return schema;
    }

    /**
     * Returns {@code schema} as an XML element with the attributes {@code namesAndValues}, given
     * as name/value pairs in the order they are written.
     */
    public static SchemaDTO withXmlAttributes(SchemaDTO schema, String... namesAndValues) {
        if (namesAndValues.length % 2 != 0) {
            throw new IllegalArgumentException("XML attributes must be name/value pairs");
        }

        Map<String, String> attributes = new LinkedHashMap<>();
        for (int i = 0; i < namesAndValues.length; i += 2) {
            attributes.put(namesAndValues[i], namesAndValues[i + 1]);
        }

        XmlObjectDTO xml = new XmlObjectDTO();
        xml.setAttributes(attributes);
        schema.setXml(xml);

        return schema;
    }
}
