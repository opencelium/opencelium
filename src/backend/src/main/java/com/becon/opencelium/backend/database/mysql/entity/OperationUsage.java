package com.becon.opencelium.backend.database.mysql.entity;

import jakarta.persistence.*;

import java.math.BigInteger;
import java.time.LocalDateTime;

@Entity
@Table(name = "operation_usage")
public class OperationUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String subId;

    private LocalDateTime createdAt;

    private BigInteger operationNum;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumns({
            @JoinColumn(name = "scheduler_id", referencedColumnName = "id"),
//            @JoinColumn(name = "connection_id", referencedColumnName = "connection_id")
    })
    private Scheduler scheduler;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSubId() {
        return subId;
    }

    public void setSubId(String subId) {
        this.subId = subId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public BigInteger getOperationNum() {
        return operationNum;
    }

    public void setOperationNum(BigInteger operationNum) {
        this.operationNum = operationNum;
    }

    public Scheduler getScheduler() {
        return scheduler;
    }

    public void setScheduler(Scheduler scheduler) {
        this.scheduler = scheduler;
    }
}
