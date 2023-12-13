package com.becon.opencelium.backend.resource.notification;

import com.becon.opencelium.backend.database.mysql.entity.EventMessage;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class MessageResource {

    private int templateId;
    private String name;
    private String type;
    private List<ContentResource> content = new ArrayList<>();


    public MessageResource(EventMessage eventMessage){
        this.templateId = eventMessage.getId();
        this.name = eventMessage.getName();
        this.type = eventMessage.getType();
        this.content = eventMessage.getEventContents()
                .stream()
                .map(c->new ContentResource(c))
                .collect(Collectors.toList());
    }

    public MessageResource() {
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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public List<ContentResource> getContent() {
        return content;
    }

    public void setContent(List<ContentResource> content) {
        this.content = content;
    }
}
