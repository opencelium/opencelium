package com.becon.opencelium.backend.database.mysql.entity;

import com.becon.opencelium.backend.enums.Action;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity(name = "connection_history")
public class ConnectionHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Connection connection;

    @ManyToOne
    private User user;

    @Column(name = "oc_version")
    private String ocVersion;

    @CreationTimestamp
    private LocalDateTime created;

    @Column(name = "json_patch")
    private String jsonPatch;

    @Enumerated(EnumType.STRING)
    private Action action;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Connection getConnection() {
        return connection;
    }

    public void setConnection(Connection connection) {
        this.connection = connection;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getOcVersion() {
        return ocVersion;
    }

    public void setOcVersion(String ocVersion) {
        this.ocVersion = ocVersion;
    }

    public LocalDateTime getCreated() {
        return created;
    }

    public String getJsonPatch() {
        return jsonPatch;
    }

    public void setJsonPatch(String jsonPatch) {
        this.jsonPatch = jsonPatch;
    }

    public Action getAction() {
        return action;
    }

    public void setAction(Action action) {
        this.action = action;
    }
}
