package com.becon.opencelium.backend.constant.props;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "opencelium.online-services")
public class OnlineServicesProps {
    private InvokerSync invokerSync;

    private TemplateSync templateSync;

    private Boolean active;

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
