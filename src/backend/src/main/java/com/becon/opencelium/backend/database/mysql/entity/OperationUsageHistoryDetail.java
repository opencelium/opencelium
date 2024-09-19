package com.becon.opencelium.backend.database.mysql.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "operation_usage_history_detail")
public class OperationUsageHistoryDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "start_date", nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime startDate;

    @Column(name = "operation_usage", nullable = false)
    private long operationUsage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_usage_history_id", nullable = false)
    private OperationUsageHistory operationUsageHistory;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public long getOperationUsage() {
        return operationUsage;
    }

    public void setOperationUsage(long operationUsage) {
        this.operationUsage = operationUsage;
    }

    public OperationUsageHistory getOperationUsageHistory() {
        return operationUsageHistory;
    }

    public void setOperationUsageHistory(OperationUsageHistory operationUsageHistory) {
        this.operationUsageHistory = operationUsageHistory;
    }
}
