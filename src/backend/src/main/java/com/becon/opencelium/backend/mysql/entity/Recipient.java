package com.becon.opencelium.backend.mysql.entity;

import com.becon.opencelium.backend.resource.notification.RecipientResource;
import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "recipient")
public class Recipient {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @Column(name = "destination")
    private String destination;

    @JsonIgnore
    @ManyToMany(mappedBy = "recipients")
    private List<Notification> notifications = new ArrayList<>();

    public Recipient() {
    }

    public Recipient(RecipientResource recipientResource) {
        this.id = recipientResource.getRecipientId();
        this.destination = recipientResource.getDescription();
    }

    public Recipient(String recipientResource) {
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

    public List<Notification> getNotifications() {
        return notifications;
    }

    public void setNotifications(List<Notification> notifications) {
        this.notifications = notifications;
    }
}
