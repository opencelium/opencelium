package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.enums.execution.DataType;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;

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
}
