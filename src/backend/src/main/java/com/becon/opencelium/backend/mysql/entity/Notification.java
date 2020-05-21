
package com.becon.opencelium.backend.mysql.entity;

import com.becon.opencelium.backend.resource.notification.NotificationResource;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "scheduler_id")
    private Scheduler scheduler;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "message_id")
    private Message message;


    @ManyToMany(cascade = CascadeType.ALL)
    @JoinTable(name = "notification_has_recipient",
            joinColumns = @JoinColumn(name = "notification_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "recipient_id", referencedColumnName = "id"))
    private List<Recipient> recipients = new ArrayList<>();

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

    public Scheduler getScheduler() {
        return scheduler;
    }

    public void setScheduler(Scheduler scheduler) {
        this.scheduler = scheduler;
    }

    public List<Recipient> getRecipients() {
        return recipients;
    }

    public void setRecipients(List<Recipient> recipients) {
        this.recipients = recipients;
    }

    public Message getMessage() { return message; }

    public void setMessage(Message message) { this.message = message; }
}

