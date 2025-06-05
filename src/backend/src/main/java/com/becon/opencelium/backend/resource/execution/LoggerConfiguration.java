package com.becon.opencelium.backend.resource.execution;

import com.becon.opencelium.backend.quartz.QuartzJobScheduler;

public class LoggerConfiguration {
    private boolean debugMode;
    private QuartzJobScheduler.TriggerType triggerType;

    public boolean isDebugMode() {
        return debugMode;
    }

    public void setDebugMode(boolean debugMode) {
        this.debugMode = debugMode;
    }

    public QuartzJobScheduler.TriggerType getTriggerType() {
        return triggerType;
    }

    public void setTriggerType(QuartzJobScheduler.TriggerType triggerType) {
        this.triggerType = triggerType;
    }
}
