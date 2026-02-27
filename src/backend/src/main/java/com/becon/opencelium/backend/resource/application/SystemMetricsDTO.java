package com.becon.opencelium.backend.resource.application;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class SystemMetricsDTO {

    private Integer totalExecs;

    private Integer totalFailedExecs;

    private Long totalRuntime;

    private Long averageRuntimeS;

    private Double cpuUsage;

    private Double memoryUsage;

    private Double execLogSize;

    public Integer getTotalExecs() {
        return totalExecs;
    }

    public void setTotalExecs(Integer totalExecs) {
        this.totalExecs = totalExecs;
    }

    public Integer getTotalFailedExecs() {
        return totalFailedExecs;
    }

    public void setTotalFailedExecs(Integer totalFailedExecs) {
        this.totalFailedExecs = totalFailedExecs;
    }

    public Long getTotalRuntime() {
        return totalRuntime;
    }

    public void setTotalRuntime(Long totalRuntime) {
        this.totalRuntime = totalRuntime;
    }

    public Long getAverageRuntimeS() {
        return averageRuntimeS;
    }

    public void setAverageRuntimeS(Long averageRuntimeS) {
        this.averageRuntimeS = averageRuntimeS;
    }

    public Double getCpuUsage() {
        return cpuUsage;
    }

    public void setCpuUsage(Double cpuUsage) {
        this.cpuUsage = cpuUsage;
    }

    public Double getMemoryUsage() {
        return memoryUsage;
    }

    public void setMemoryUsage(Double memoryUsage) {
        this.memoryUsage = memoryUsage;
    }

    public Double getExecLogSize() {
        return execLogSize;
    }

    public void setExecLogSize(Double execLogSize) {
        this.execLogSize = execLogSize;
    }
}
