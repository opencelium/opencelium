package com.becon.opencelium.backend.execution.log.msg;

public class Connector {
    private String name;
    private String dir;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDir() {
        return dir;
    }

    public Connector setDir(String dir) {
        this.dir = dir;
        return this;
    }
}
