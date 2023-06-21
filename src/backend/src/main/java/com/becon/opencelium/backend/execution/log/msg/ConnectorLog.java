package com.becon.opencelium.backend.execution.log.msg;

public class ConnectorLog {
    private String name;
    private String dir;

    public ConnectorLog() {
    }

    public ConnectorLog(String name, String dir) {
        this.name = name;
        this.dir = dir.equals("CONN1") ? "from" : "to";
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDir() {
        return dir;
    }

    public ConnectorLog setDir(String dir) {
        this.dir = dir;
        return this;
    }
}
