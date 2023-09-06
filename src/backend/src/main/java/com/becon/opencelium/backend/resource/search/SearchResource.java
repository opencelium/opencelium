package com.becon.opencelium.backend.resource.search;

import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import jakarta.annotation.Resource;

@Resource
public class SearchResource {

    private long id;
    private String title;
    private String components;

    public SearchResource(Connection connection) {
        this.id = connection.getId();
        this.title = connection.getName();
        this.components = "connection";
    }

    public SearchResource(Scheduler scheduler) {
        this.id = scheduler.getId();
        this.title = scheduler.getTitle();
        this.components = "scheduler";
    }

    public SearchResource(Connector connector) {
        this.id = connector.getId();
        this.title = connector.getTitle();
        this.components = "connector";
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getComponents() {
        return components;
    }

    public void setComponents(String component) {
        this.components = component;
    }
}
