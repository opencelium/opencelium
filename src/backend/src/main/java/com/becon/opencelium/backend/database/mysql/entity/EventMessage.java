package com.becon.opencelium.backend.database.mysql.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "event_message")
public class EventMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "name")
    private String name;

    @Column(name = "type")
    private String type;

    @OneToMany(mappedBy = "eventMessage", fetch = FetchType.EAGER, cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<EventContent> eventContents;

    @OneToMany(mappedBy = "eventMessage", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<EventNotification> eventMessage;

    public EventMessage() {
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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }


    public List<EventContent> getEventContents() {
        return eventContents;
    }

    public void setEventContents(List<EventContent> eventContents) {
        this.eventContents = eventContents;
    }
}
