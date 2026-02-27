package com.becon.opencelium.backend.resource.application;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "SystemMetrics", description = "Aggregated system and execution statistics for the dashboard")
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class SystemMetricsDTO {

    @Schema(description = "Total number of executions (all time)", example = "503")
    private Integer totalExecs;

    @Schema(description = "Total number of failed executions (all time)", example = "103")
    private Integer totalFailedExecs;

    @Schema(description = "Sum of all execution durations in milliseconds", example = "4046400000")
    private Long totalRuntime;

    @Schema(description = "Average duration of successful executions in milliseconds", example = "1980000")
    private Long averageRuntimeS;

    @Schema(description = "Current JVM process CPU usage as a percentage (0.00 – 100.00)", example = "15.0")
    private Double cpuUsage;

    @Schema(description = "Current JVM process committed virtual memory in MB", example = "480.5")
    private Double memoryUsage;

    @Schema(description = "Total size of execution log files on disk in MB", example = "4330.21")
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
