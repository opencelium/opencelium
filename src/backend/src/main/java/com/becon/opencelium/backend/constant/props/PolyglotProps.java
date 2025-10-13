package com.becon.opencelium.backend.constant.props;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.file.Files;
import java.nio.file.Paths;

@ConfigurationProperties(prefix = "opencelium.polyglot")
public class PolyglotProps {

    private static final Logger logger = LoggerFactory.getLogger(PolyglotProps.class);

    private static final String DEFAULT_PROTOCOL = "grpc";
    private static final String DEFAULT_HOST = "127.0.0.1";
    private static final int DEFAULT_PORT = 6566;

    private Boolean enabled = false;
    private String protocol;
    private String host;
    private Integer port;
    private Boolean autoStart = false;
    private LaunchConfig launch = new LaunchConfig();

    @PostConstruct
    public void validate() {
        if (!isEnabled()) {
            return;
        }

        try {
            applyDefaults();
            validateProtocol();
            validateHost();
            validatePort();

            if (isAutoStart()) {
                launch.validate();
            }
        } catch (IllegalStateException e) {
            logger.error("Polyglot configuration validation failed: {}. Application will use fallback engine.", e.getMessage());
            throw new RuntimeException(e);
        }
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

    public LaunchConfig getLaunch() {
        return launch;
    }

    public void setLaunch(LaunchConfig launch) {
        this.launch = launch;
    }

    public boolean isEnabled() {
        return Boolean.TRUE.equals(enabled);
    }

    public boolean isAutoStart() {
        return Boolean.TRUE.equals(autoStart);
    }

    public String getJarPath() {
        if (this.launch == null) {
            return null;
        }

        return this.launch.jarPath;
    }

    public String getJvmArgs() {
        if (this.launch == null) {
            return null;
        }

        return this.launch.jvmArgs;
    }

    public String getArgs() {
        if (this.launch == null) {
            return null;
        }

        return this.launch.args;
    }

    public int getWaitTimeoutSec() {
        if (this.launch == null) {
            return LaunchConfig.DEFAULT_WAIT_TIMEOUT;
        }

        return this.launch.waitTimeoutSec;
    }

    public boolean isExternalLogEnabled() {
        return this.launch != null && Boolean.TRUE.equals(this.launch.externalLogEnabled);
    }

    /**
     * Nested configuration for polyglot service startup settings.
     */
    public static class LaunchConfig {

        private static final int DEFAULT_WAIT_TIMEOUT = 30;
        private static final int MAX_WAIT_TIMEOUT = 300;

        private String jarPath;
        private String jvmArgs;
        private String args;
        private Integer waitTimeoutSec;
        private Boolean externalLogEnabled = false;

        void validate() {
            applyDefaults();
            validateJarPath();
            validateWaitTimeout();
        }

        private void applyDefaults() {
            if (waitTimeoutSec == null) {
                waitTimeoutSec = DEFAULT_WAIT_TIMEOUT;
            }
        }

        private void validateJarPath() {
            if (jarPath == null || jarPath.trim().isEmpty()) {
                throw new IllegalStateException(
                        "opencelium.polyglot.launch.jarPath must be specified when auto-start is enabled");
            }
            if (!Files.exists(Paths.get(jarPath))) {
                throw new IllegalStateException("JAR file not found at: " + jarPath);
            }
        }

        private void validateWaitTimeout() {
            if (waitTimeoutSec < 1 || waitTimeoutSec > MAX_WAIT_TIMEOUT) {
                throw new IllegalStateException(
                        "opencelium.polyglot.launch.waitTimeoutSec must be between 1 and "
                                + MAX_WAIT_TIMEOUT + ". Got: " + waitTimeoutSec);
            }
        }

        // Getters and setters

        public void setJarPath(String jarPath) {
            this.jarPath = jarPath;
        }

        public void setJvmArgs(String jvmArgs) {
            this.jvmArgs = jvmArgs;
        }

        public void setArgs(String args) {
            this.args = args;
        }

        public void setWaitTimeoutSec(Integer waitTimeoutSec) {
            this.waitTimeoutSec = waitTimeoutSec;
        }

        public void setExternalLogEnabled(Boolean externalLogEnabled) {
            this.externalLogEnabled = externalLogEnabled;
        }
    }
}