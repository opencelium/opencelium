package com.becon.opencelium.backend.resource.execution;

public class ProxyEx {
    private String host;
    private String port;
    private String password;
    private String user;

    public ProxyEx() {
    }

    public ProxyEx(String host, String port, String password, String user) {
        this.host = host;
        this.port = port;
        this.password = password;
        this.user = user;
    }

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }

    public String getPort() {
        return port;
    }

    public void setPort(String port) {
        this.port = port;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }
}
