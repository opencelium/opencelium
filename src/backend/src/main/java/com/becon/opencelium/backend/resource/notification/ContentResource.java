package com.becon.opencelium.backend.resource.notification;

import com.becon.opencelium.backend.mysql.entity.Content;
import org.springframework.hateoas.ResourceSupport;

public class ContentResource extends ResourceSupport {

    private int contentId;
    private String subject;
    private String body;
    private String language;

    public ContentResource(Content content){
        this.contentId = content.getId();
        this.subject = content.getSubject();
        this.body = content.getBody();
        this.language = content.getLanguage();
    }

    public ContentResource() {
    }

    public int getContentId() {
        return contentId;
    }

    public void setContentId(int contentId) {
        this.contentId = contentId;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}
