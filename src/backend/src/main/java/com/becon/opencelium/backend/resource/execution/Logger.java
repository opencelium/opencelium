package com.becon.opencelium.backend.resource.execution;

public class Logger {
    private boolean debugMode;
    private boolean isWSocketOpen;

    public boolean isDebugMode() {
        return debugMode;
    }

    public void setDebugMode(boolean debugMode) {
        this.debugMode = debugMode;
    }

    public boolean isWSocketOpen() {
        return isWSocketOpen;
    }

    public void setWSocketOpen(boolean WSocketOpen) {
        isWSocketOpen = WSocketOpen;
    }
}
