package com.becon.opencelium.backend.resource.notification;

import com.becon.opencelium.backend.mysql.entity.Message;
import org.springframework.hateoas.ResourceSupport;

public class MessageResource extends ResourceSupport {

    private int messageId;
    private String name;
    private String type;
    private int contentId;


    public MessageResource(Message message){
        this.messageId = message.getId();
        this.name = message.getName();
        this.type = message.getType();
        this.contentId = message.getContent().getId();
    }

    public MessageResource() {
    }


    public int getMessageId() {
        return messageId;
    }

    public void setMessageId(int messageId) {
        this.messageId = messageId;
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

    public int getContentId() {
        return contentId;
    }

    public void setContentId(int contentId) {
        this.contentId = contentId;
    }
}
