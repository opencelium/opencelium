
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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "scheduler_id")
    private Scheduler scheduler;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "message_id")
    private Message message;

    @OneToMany(mappedBy = "notification", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<NotificationHasRecipient> notificationHasRecipients = new HashSet<NotificationHasRecipient>();

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

    public Scheduler getScheduler() {
        return scheduler;
    }

    public void setScheduler(Scheduler scheduler) {
        this.scheduler = scheduler;
    }

    public Set<NotificationHasRecipient> getNotificationHasRecipients() {
        return notificationHasRecipients;
    }

    public void setNotificationHasRecipients(Set<NotificationHasRecipient> notificationHasRecipients) {
        this.notificationHasRecipients = notificationHasRecipients;
    }

    public Message getMessage() { return message; }

    public void setMessage(Message message) { this.message = message; }
}

