package com.becon.opencelium.backend.resource.notification;

import org.springframework.hateoas.ResourceSupport;

public class TemplateMessageResource extends ResourceSupport {
    private int templateId;
    private String name;

    public TemplateMessageResource() {
    }

    public TemplateMessageResource(int templateId, String templateName) {
        this.templateId = templateId;
        this.name = templateName;
    }

    public int getTemplateId() {
        return templateId;
    }

    public void setTemplateId(int templateId) {
        this.templateId = templateId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
