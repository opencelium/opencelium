package com.becon.opencelium.backend.resource.execution;

public class LoggerConfiguration {
    private boolean debugMode;
    private boolean log2File;
    private boolean isWSocketOpen;

    public boolean isDebugMode() {
        return debugMode;
    }

    public void setDebugMode(boolean debugMode) {
        this.debugMode = debugMode;
    }

    public boolean isLog2File() {
        return log2File;
    }

    public void setLog2File(boolean log2File) {
        this.log2File = log2File;
    }

    public boolean isWSocketOpen() {
        return isWSocketOpen;
    }

    public void setWSocketOpen(boolean WSocketOpen) {
        isWSocketOpen = WSocketOpen;
    }
}
