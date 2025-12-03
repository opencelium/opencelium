package com.becon.opencelium.backend.resource.v5.template;

public class TemplateV5 {
    private String templateId;
    private String name;
    private String description;
    private String license;
    private String version;
    private String link;
    private CtionTemplateV5Resource connection;
    private int ops;

    public String getTemplateId() {
        return templateId;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLicense() {
        return license;
    }

    public void setLicense(String license) {
        this.license = license;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getLink() {
        return link;
    }

    public void setLink(String link) {
        this.link = link;
    }

    public CtionTemplateV5Resource getConnection() {
        return connection;
    }

    public void setConnection(CtionTemplateV5Resource connection) {
        this.connection = connection;
    }

    public int getOps() {
        return ops;
    }

    public void setOps(int ops) {
        this.ops = ops;
    }
}
