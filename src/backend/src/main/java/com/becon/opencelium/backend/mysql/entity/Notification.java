
package com.becon.opencelium.backend.mysql.entity;

import javax.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @Column(name = "name")
    private String name;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "app")
    private String app;

    @Column(name = "text")
    private String text;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "scheduler_id")
    private Scheduler scheduler;

    @OneToMany(mappedBy = "notification", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<NotificationHasRecipient> recipients = new HashSet<NotificationHasRecipient>();

    public Notification() {
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getApp() {
        return app;
    }

    public void setApp(String app) {
        this.app = app;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public Scheduler getScheduler() {
        return scheduler;
    }

    public void setScheduler(Scheduler scheduler) {
        this.scheduler = scheduler;
    }

    public Set<NotificationHasRecipient> getRecipients() {
        return recipients;
    }

    public void setRecipients(Set<NotificationHasRecipient> recipients) {
        this.recipients = recipients;
    }
}

