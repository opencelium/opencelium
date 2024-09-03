package com.becon.opencelium.backend.database.mysql.entity;

import jakarta.persistence.*;

import java.math.BigInteger;
import java.time.LocalDateTime;

@Entity
@Table(name = "operation_usage_history")
public class OperationUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String subId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "operation_num")
    private BigInteger operationNum;

    @Column(name = "connection_title")
    private String connectionTitle;

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

    public String getConnectionTitle() {
        return connectionTitle;
    }

    public void setConnectionTitle(String connectionTitle) {
        this.connectionTitle = connectionTitle;
    }
}
