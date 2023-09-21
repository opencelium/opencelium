
package com.becon.opencelium.backend.mysql.entity;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "event_notification")
public class EventNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "name")
    private String name;

    @Column(name = "event_type")
    private String eventType; //post, pre, alert

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheduler_id")
    private Scheduler scheduler;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "event_message_id")
    private EventMessage eventMessage;

    @ManyToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinTable(name = "event_notification_has_event_recipient",
            joinColumns = @JoinColumn(name = "event_notification_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "event_recipient_id", referencedColumnName = "id"))
    private Set<EventRecipient> eventRecipients = new HashSet<>();

    public EventNotification() {
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

    public Set<EventRecipient> getEventRecipients() {
        return eventRecipients;
    }

    public void setEventRecipients(Set<EventRecipient> eventRecipients) {
        this.eventRecipients = eventRecipients;
    }

    public EventMessage getEventMessage() { return eventMessage; }

    public void setEventMessage(EventMessage eventMessage) { this.eventMessage = eventMessage; }
}

