package com.becon.opencelium.backend.constant.props;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds the {@code opencelium.online-services} block of application.yml. The top-level
 * {@code active} flag is the master switch for every feature that calls a remote
 * OpenCelium-operated or external service (Service Portal, invoker repository,
 * update repository); the nested blocks configure the two scheduled sync jobs.
 */
@ConfigurationProperties(prefix = "opencelium.online-services")
public class OnlineServicesProps {

    /**
     * Message returned to the client when an online endpoint is called while
     * online services are disabled.
     */
    public static final String DISABLED_MESSAGE = "Online services are disabled. To enable them, set"
            + " 'opencelium.online-services.active' to true in the application.yml file.";

    private InvokerSync invokerSync;

    private TemplateSync templateSync;

    private Boolean active;

    /**
     * Returns the effective state of the master switch. A missing key (the block is
     * commented out or removed from application.yml) means online services are enabled.
     */
    public boolean isServiceActive() {
        return active == null || active;
    }

    public InvokerSync getInvokerSync() {
        return invokerSync;
    }

    public void setInvokerSync(InvokerSync invokerSync) {
        this.invokerSync = invokerSync;
    }

    public TemplateSync getTemplateSync() {
        return templateSync;
    }

    public void setTemplateSync(TemplateSync templateSync) {
        this.templateSync = templateSync;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public static class InvokerSync {
        private Boolean active;
        private String time;

        public Boolean getActive() {
            return active;
        }

        public void setActive(Boolean active) {
            this.active = active;
        }

        public String getTime() {
            return time;
        }

        public void setTime(String time) {
            this.time = time;
        }
    }

    public static class TemplateSync {
        private Boolean active;
        private String time;

        public Boolean getActive() {
            return active;
        }

        public void setActive(Boolean active) {
            this.active = active;
        }

        public String getTime() {
            return time;
        }

        public void setTime(String time) {
            this.time = time;
        }
    }
}
