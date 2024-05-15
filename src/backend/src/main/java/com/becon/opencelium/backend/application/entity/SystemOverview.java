package com.becon.opencelium.backend.application.entity;

public class SystemOverview {

    private String java;
    private String os;
    private String mariadb;
    private String mongodb;

    public String getJava() {
        return java;
    }

    public void setJava(String java) {
        this.java = java;
    }

    public String getOs() {
        return os;
    }

    public void setOs(String os) {
        this.os = os;
    }

    public String getMariadb() {
        return mariadb;
    }

    public void setMariadb(String mariadb) {
        this.mariadb = mariadb;
    }

    public String getMongodb() {
        return mongodb;
    }

    public void setMongodb(String mongodb) {
        this.mongodb = mongodb;
    }
}
