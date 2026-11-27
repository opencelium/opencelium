package com.becon.opencelium.backend.resource.execution;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public class XmlObjectDTO {
    private String name;
    private String namespace;
    private String prefix;
    private boolean attribute;
    private boolean wrapped;
    private Map<String, String> attributes = Map.of();

    public static XmlObjectDTO copy(XmlObjectDTO xml) {
        if (xml == null) {
            return null;
        }

        XmlObjectDTO result = new XmlObjectDTO();

        result.setName(xml.getName());
        result.setNamespace(xml.getNamespace());
        result.setPrefix(xml.getPrefix());
        result.setAttribute(xml.isAttribute());
        result.setWrapped(xml.isWrapped());
        result.setAttributes(xml.getAttributes());

        return result;
    }

    /**
     * Returns the attributes written on the element, name to value, in the order they are
     * written. A namespace declaration such as {@code xmlns:soap} is one of them. A value may
     * hold references until the request is built. Never {@code null}, and not modifiable.
     */
    public Map<String, String> getAttributes() {
        return attributes;
    }

    /** Sets the attributes of the element, keeping their order; {@code null} means none. */
    public void setAttributes(Map<String, String> attributes) {
        this.attributes = attributes == null || attributes.isEmpty()
                ? Map.of()
                : Collections.unmodifiableMap(new LinkedHashMap<>(attributes));
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNamespace() {
        return namespace;
    }

    public void setNamespace(String namespace) {
        this.namespace = namespace;
    }

    public String getPrefix() {
        return prefix;
    }

    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }

    public boolean isAttribute() {
        return attribute;
    }

    public void setAttribute(boolean attribute) {
        this.attribute = attribute;
    }

    public boolean isWrapped() {
        return wrapped;
    }

    public void setWrapped(boolean wrapped) {
        this.wrapped = wrapped;
    }
}
