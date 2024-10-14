package com.becon.opencelium.backend.resource;

import jakarta.annotation.Resource;

@Resource
public class LdapVerificationMessageDTO {
    private String title;
    private String text;

    public LdapVerificationMessageDTO(String title, String text) {
        this.title = title;
        this.text = text;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}
