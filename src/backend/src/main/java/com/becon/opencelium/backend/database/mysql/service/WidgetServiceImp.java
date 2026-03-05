package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.constant.LogConstant;
import com.becon.opencelium.backend.database.mysql.entity.Widget;
import com.becon.opencelium.backend.resource.application.ExecutionStatsDTO;
import com.becon.opencelium.backend.database.mysql.repository.WidgetRepository;
import com.becon.opencelium.backend.resource.application.SystemMetricsDTO;
import com.becon.opencelium.backend.resource.user.WidgetResource;
import com.becon.opencelium.backend.utility.LogFileUtility;
import com.sun.management.OperatingSystemMXBean;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

@Service
public class WidgetServiceImp implements WidgetService {

    private static final Logger log = LoggerFactory.getLogger(WidgetServiceImp.class);

    private final WidgetRepository widgetRepository;

    private final ExecutionService executionService;

    private final MeterRegistry meterRegistry;

    public WidgetServiceImp(WidgetRepository widgetRepository, ExecutionService executionService, MeterRegistry meterRegistry) {
        this.widgetRepository = widgetRepository;
        this.executionService = executionService;
        this.meterRegistry = meterRegistry;
    }

    @Override
    public void save(Widget widget) {
        widgetRepository.save(widget);
    }

    @Override
    public Optional<Widget> findById(int id) {
        return widgetRepository.findById(id);
    }

    @Override
    public void deleteById(int id) {
        widgetRepository.deleteById(id);
    }

    @Override
    public List<Widget> findAll() {
        return widgetRepository.findAll();
    }

    @Override
    public Widget toEntity(WidgetResource widgetResource) {
        return new Widget(widgetResource);
    }

    @Override
    public WidgetResource toResource(Widget widget) {
        return new WidgetResource(widget);
    }

    @Override
    public SystemMetricsDTO getSystemMetrics() {
        SystemMetricsDTO dto = new SystemMetricsDTO();
        populateExecutionStats(dto);
        populateCpuUsage(dto);
        populateMemoryUsage(dto);
        populateExecLogSize(dto);
        return dto;
    }

    private void populateExecutionStats(SystemMetricsDTO dto) {
        try {
            ExecutionStatsDTO stats = executionService.getStats();
            dto.setTotalExecs(stats.totalExecs());
            dto.setTotalFailedExecs(stats.totalFailed());
            dto.setTotalRuntime(stats.totalRuntime());
            dto.setAverageRuntimeS(stats.avgRuntime());
        } catch (Exception e) {
            log.error("Failed to retrieve execution stats", e);
        }
    }

    private void populateCpuUsage(SystemMetricsDTO dto) {
        try {
            double cpuRatio = meterRegistry.get("process.cpu.usage").gauge().value();
            dto.setCpuUsage(Math.round(cpuRatio * 10000.0) / 100.0);
        } catch (Exception e) {
            log.error("Failed to retrieve CPU usage", e);
        }
    }

    private void populateMemoryUsage(SystemMetricsDTO dto) {
        try {
            java.lang.management.OperatingSystemMXBean base = ManagementFactory.getOperatingSystemMXBean();
            if (base instanceof OperatingSystemMXBean os) {
                dto.setMemoryUsage(os.getCommittedVirtualMemorySize() / 1024);
                dto.setMaxMemorySize(os.getTotalMemorySize() / 1024);
            } else {
                // fallback: JVM heap + non-heap committed / max
                long heapCommitted    = (long) meterRegistry.get("jvm.memory.committed").tag("area", "heap").gauge().value();
                long nonHeapCommitted = (long) meterRegistry.get("jvm.memory.committed").tag("area", "nonheap").gauge().value();
                dto.setMemoryUsage((heapCommitted + nonHeapCommitted) / 1024);

                long heapMax    = (long) meterRegistry.get("jvm.memory.max").tag("area", "heap").gauge().value();
                long nonHeapMax = (long) meterRegistry.get("jvm.memory.max").tag("area", "nonheap").gauge().value();
                dto.setMaxMemorySize((heapMax + nonHeapMax) / 1024);
            }
        } catch (Exception e) {
            log.error("Failed to retrieve memory usage", e);
        }
    }

    private void populateExecLogSize(SystemMetricsDTO dto) {
        try {
            dto.setExecLogSize(calcLogSizeMB());
        } catch (Exception e) {
            log.error("Failed to calculate execution log size", e);
        }
    }

    private long calcLogSizeMB() {
        Path logDir = LogFileUtility.toPath(LogConstant.LOG_LOCATION);
        if (!Files.exists(logDir)) {
            return 0L;
        }
        try (Stream<Path> stream = Files.walk(logDir)) {
            long bytes = stream
                    .filter(Files::isRegularFile)
                    .mapToLong(p -> p.toFile().length())
                    .sum();
            return bytes / 1024;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
