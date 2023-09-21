package com.becon.opencelium.backend.resource.execution;

public class XmlObjectDTO {
    private String name;
    private String namespace;
    private String prefix;
    private boolean attribute;
    private boolean wrapped;

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
