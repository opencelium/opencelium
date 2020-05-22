package com.becon.opencelium.backend.mysql.entity;

import com.becon.opencelium.backend.resource.notification.RecipientResource;
import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "event_recipient")
public class EventRecipient {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @Column(name = "destination")
    private String destination;

    @JsonIgnore
    @ManyToMany(mappedBy = "eventRecipients")
    private List<EventNotification> eventNotifications = new ArrayList<>();

    public EventRecipient() {
    }

    public EventRecipient(RecipientResource recipientResource) {
        this.id = recipientResource.getRecipientId();
        this.destination = recipientResource.getDescription();
    }

    public EventRecipient(String recipientResource) {
        this.destination = recipientResource;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public List<EventNotification> getEventNotifications() {
        return eventNotifications;
    }

    public void setEventNotifications(List<EventNotification> eventNotifications) {
        this.eventNotifications = eventNotifications;
    }
}
