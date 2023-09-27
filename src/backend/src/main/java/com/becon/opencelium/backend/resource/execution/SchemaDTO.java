package com.becon.opencelium.backend.resource.execution;

import java.util.Map;

public class SchemaDTO {
    private DataType type;
    private String value;
    private Map<String, SchemaDTO> properties;
    private SchemaDTO items;
    private XmlObjectDTO xml;

    public DataType getType() {
        return type;
    }

    public void setType(DataType type) {
        this.type = type;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public Map<String, SchemaDTO> getProperties() {
        return properties;
    }

    public void setProperties(Map<String, SchemaDTO> properties) {
        this.properties = properties;
    }

    public SchemaDTO getItems() {
        return items;
    }

    public void setItems(SchemaDTO items) {
        this.items = items;
    }

    public XmlObjectDTO getXml() {
        return xml;
    }

    public void setXml(XmlObjectDTO xml) {
        this.xml = xml;
    }
}
