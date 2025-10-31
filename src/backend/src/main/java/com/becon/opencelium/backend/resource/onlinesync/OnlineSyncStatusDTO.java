package com.becon.opencelium.backend.resource.onlinesync;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class OnlineSyncStatusDTO {

    private Boolean active;

    private InvokerSync invokerSync;

    private TemplateSync templateSync;

    public static OnlineSyncStatusDTO fromStatus(Boolean active, Boolean invokerSyncActive, Boolean templateSyncActive) {
        OnlineSyncStatusDTO statusDTO = new OnlineSyncStatusDTO();
        statusDTO.setActive(Boolean.TRUE.equals(active));
        statusDTO.setInvokerSync(new InvokerSync(Boolean.TRUE.equals(invokerSyncActive)));
        statusDTO.setTemplateSync(new TemplateSync(Boolean.TRUE.equals(templateSyncActive)));
        return statusDTO;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
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

    public static class InvokerSync {

        private Boolean active;

        public InvokerSync(Boolean active) {
            this.active = active;
        }

        public Boolean getActive() {
            return active;
        }

        public void setActive(Boolean active) {
            this.active = active;
        }
    }

    public static class TemplateSync {

        private Boolean active;

        public TemplateSync(Boolean active) {
            this.active = active;
        }

        public Boolean getActive() {
            return active;
        }

        public void setActive(Boolean active) {
            this.active = active;
        }
    }
}
