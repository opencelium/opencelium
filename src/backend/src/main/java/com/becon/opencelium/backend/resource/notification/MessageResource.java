package com.becon.opencelium.backend.resource.notification;

import com.becon.opencelium.backend.mysql.entity.Message;
import org.springframework.hateoas.ResourceSupport;

public class MessageResource extends ResourceSupport {

    private int messageId;
    private String templateName;
    private String templateType;
    private int contentId;


    public MessageResource(Message message){
        this.messageId = message.getId();
        this.templateName = message.getName();
        this.templateType = message.getType();
        this.contentId = message.getContent().getId();
    }


    public int getMessageId() {
        return messageId;
    }

    public void setMessageId(int messageId) {
        this.messageId = messageId;
    }

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }

    public String getTemplateType() {
        return templateType;
    }

    public void setTemplateType(String templateType) {
        this.templateType = templateType;
    }

    public int getContentId() {
        return contentId;
    }

    public void setContentId(int contentId) {
        this.contentId = contentId;
    }
}
