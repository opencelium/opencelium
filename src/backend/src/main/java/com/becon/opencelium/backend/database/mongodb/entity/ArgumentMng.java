package com.becon.opencelium.backend.database.mongodb.entity;

public class ArgumentMng {
    private String name;
    private String description;

    public ArgumentMng() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
