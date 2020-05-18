package com.becon.opencelium.backend.mysql.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "recipient")
public class Recipient {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @Column(name = "description")
    private String description;

    @JsonIgnore
    @OneToMany(mappedBy = "recipient", fetch = FetchType.EAGER)
    private Set<NotificationHasRecipient> notifications = new HashSet<NotificationHasRecipient>();

    public Recipient() {
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Set<NotificationHasRecipient> getNotifications() {
        return notifications;
    }

    public void setNotifications(Set<NotificationHasRecipient> notifications) {
        this.notifications = notifications;
    }
}
