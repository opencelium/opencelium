package com.becon.opencelium.backend.mysql.entity;

import com.becon.opencelium.backend.resource.notification.ContentResource;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

@Entity
@Table(name = "event_content")
public class EventContent {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @Column(name = "subject")
    private String subject;

    @Column(name = "body")
    private String body;

    @Column(name = "language")
    private String language;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_message_id")
    private EventMessage eventMessage;

    public EventContent() {
    }

    public EventContent(ContentResource contentResource) {
        this.id = contentResource.getContentId();
        this.subject = contentResource.getSubject();
        this.body = contentResource.getBody();
        this.language = contentResource.getLanguage();
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
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

    public EventMessage getEventMessage() {
        return eventMessage;
    }

    public void setEventMessage(EventMessage eventMessage) {
        this.eventMessage = eventMessage;
    }
}
