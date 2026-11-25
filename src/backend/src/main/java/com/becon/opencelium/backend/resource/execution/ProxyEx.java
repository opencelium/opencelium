package com.becon.opencelium.backend.resource.execution;

public class ProxyEx {
    private String host;
    private String port;
    private String password;
    private String user;

    public ProxyEx() {
    }

    private ProxyEx(String host, String port, String user, String password) {
        this.host = host;
        this.port = port;
        this.user = user;
        this.password = password;
    }

    /**
     * Returns the proxy settings for the given address and credentials.
     *
     * <p>The credentials come in the usual order, user first, then password.
     *
     * @param host the proxy host
     * @param port the proxy port
     * @param user the user name the proxy authenticates
     * @param password the password for {@code user}
     */
    public static ProxyEx of(String host, String port, String user, String password) {
        return new ProxyEx(host, port, user, password);
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
