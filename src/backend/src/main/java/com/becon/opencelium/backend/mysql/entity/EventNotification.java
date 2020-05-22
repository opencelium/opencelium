
package com.becon.opencelium.backend.mysql.entity;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "event_notification")
public class EventNotification {

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
    @JoinColumn(name = "event_message_id")
    private EventMessage eventMessage;

    @ManyToMany(cascade = CascadeType.ALL)
    @JoinTable(name = "event_notification_has_event_recipient",
            joinColumns = @JoinColumn(name = "event_notification_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "event_recipient_id", referencedColumnName = "id"))
    private List<EventRecipient> eventRecipients = new ArrayList<>();

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

    public List<EventRecipient> getEventRecipients() {
        return eventRecipients;
    }

    public void setEventRecipients(List<EventRecipient> eventRecipients) {
        this.eventRecipients = eventRecipients;
    }

    public EventMessage getEventMessage() { return eventMessage; }

    public void setEventMessage(EventMessage eventMessage) { this.eventMessage = eventMessage; }
}

