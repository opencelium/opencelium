package com.becon.opencelium.backend.constant.props;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.file.Files;
import java.nio.file.Paths;

@ConfigurationProperties(prefix = "opencelium.polyglot")
public class PolyglotProps {

    private static final String DEFAULT_PROTOCOL = "grpc";
    private static final String DEFAULT_HOST = "127.0.0.1";
    private static final int DEFAULT_PORT = 6566;
    private static final int DEFAULT_WAIT_TIMEOUT = 30;
    private static final int MAX_WAIT_TIMEOUT = 300;

    private Boolean enabled = false;
    private String protocol;
    private String host;
    private Integer port;
    private Boolean autoStart = true;
    private String jarPath;
    private String jvmArgs;
    private String args;
    private Integer waitTimeoutSec;

    @PostConstruct
    public void validate() {
        if (!isEnabled()) {
            return;
        }

        applyDefaults();
        validateProtocol();
        validateHost();
        validatePort();
        validateJarPath();
        validateWaitTimeout();
    }

    private void applyDefaults() {
        if (protocol == null || protocol.trim().isEmpty()) {
            protocol = DEFAULT_PROTOCOL;
        }
        if (host == null || host.trim().isEmpty()) {
            host = DEFAULT_HOST;
        }
        if (port == null) {
            port = DEFAULT_PORT;
        }
        if (waitTimeoutSec == null) {
            waitTimeoutSec = DEFAULT_WAIT_TIMEOUT;
        }
    }

    private void validateProtocol() {
        if (!protocol.matches("^(http|https|grpc)$")) {
            throw new IllegalStateException(
                    "opencelium.polyglot.protocol must be http, https, or grpc. Got: " + protocol);
        }
    }

    private void validateHost() {
        if (!host.matches("^[a-zA-Z0-9.-]+$")) {
            throw new IllegalStateException(
                    "opencelium.polyglot.host must be a valid hostname or IP address. Got: " + host);
        }
    }

    private void validatePort() {
        if (port < 1 || port > 65535) {
            throw new IllegalStateException(
                    "opencelium.polyglot.port must be between 1 and 65535. Got: " + port);
        }
    }

    private void validateJarPath() {
        if (isAutoStart()) {
            if (jarPath == null || jarPath.trim().isEmpty()) {
                throw new IllegalStateException(
                        "opencelium.polyglot.jar-path must be specified when auto-start is enabled");
            }
            if (!Files.exists(Paths.get(jarPath))) {
                throw new IllegalStateException("JAR file not found at: " + jarPath);
            }
        }
    }

    private void validateWaitTimeout() {
        if (waitTimeoutSec < 1 || waitTimeoutSec > MAX_WAIT_TIMEOUT) {
            throw new IllegalStateException(
                    "opencelium.polyglot.wait-timeout-sec must be between 1 and " + MAX_WAIT_TIMEOUT + ". Got: " + waitTimeoutSec);
        }
    }

    // Getters and setters

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public String getProtocol() {
        return protocol;
    }

    public void setProtocol(String protocol) {
        this.protocol = protocol;
    }

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }

    public Integer getPort() {
        return port;
    }

    public void setPort(Integer port) {
        this.port = port;
    }

    public Boolean getAutoStart() {
        return autoStart;
    }

    public void setAutoStart(Boolean autoStart) {
        this.autoStart = autoStart;
    }

    public String getJarPath() {
        return jarPath;
    }

    public void setJarPath(String jarPath) {
        this.jarPath = jarPath;
    }

    public String getJvmArgs() {
        return jvmArgs;
    }

    public void setJvmArgs(String jvmArgs) {
        this.jvmArgs = jvmArgs;
    }

    public String getArgs() {
        return args;
    }

    public void setArgs(String args) {
        this.args = args;
    }

    public Integer getWaitTimeoutSec() {
        return waitTimeoutSec;
    }

    public void setWaitTimeoutSec(Integer waitTimeoutSec) {
        this.waitTimeoutSec = waitTimeoutSec;
    }

    public boolean isEnabled() {
        return Boolean.TRUE.equals(enabled);
    }

    public boolean isAutoStart() {
        return Boolean.TRUE.equals(autoStart);
    }
}