package com.becon.opencelium.backend.resource.notification;

import com.becon.opencelium.backend.mysql.entity.Content;
import org.springframework.hateoas.ResourceSupport;

public class ContentResource extends ResourceSupport {

    private int contentId;
    private String contentSubject;
    private String contentBody;
    private String contentLanguage;

    public ContentResource(Content content){
        this.contentId = content.getId();
        this.contentSubject = content.getSubject();
        this.contentBody = content.getBody();
        this.contentLanguage = content.getLanguage();
    }

    public int getContentId() {
        return contentId;
    }

    public void setContentId(int contentId) {
        this.contentId = contentId;
    }

    public String getContentSubject() {
        return contentSubject;
    }

    public void setContentSubject(String contentSubject) {
        this.contentSubject = contentSubject;
    }

    public String getContentBody() {
        return contentBody;
    }

    public void setContentBody(String contentBody) {
        this.contentBody = contentBody;
    }

    public String getContentLanguage() {
        return contentLanguage;
    }

    public void setContentLanguage(String contentLanguage) {
        this.contentLanguage = contentLanguage;
    }
}
