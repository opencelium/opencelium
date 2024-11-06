package com.becon.opencelium.backend.database.mysql.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "operation_usage_history")
public class OperationUsageHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "license_id", nullable = false, length = 255)
    private String licenseId;

    @Column(name = "subId", nullable = false, length = 255)
    private String subId;

    @JsonIgnore
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP", updatable = false)
    private LocalDateTime createdAt;

    @JsonIgnore
    @UpdateTimestamp
    @Column(name = "modified_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP", updatable = false)
    private LocalDateTime modifiedAt;

    @Column(name = "total_usage", nullable = false)
    private long totalUsage;

    @Column(name = "connection_title", nullable = false, length = 255)
    private String connectionTitle;

    @Column(name = "from_invoker", nullable = false, length = 255)
    private String fromInvoker;

    @Column(name = "to_invoker", nullable = false, length = 255)
    private String toInvoker;

    @OneToMany(mappedBy = "operationUsageHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OperationUsageHistoryDetail> details;

    // Getters and Setters

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

    public String getLicenseId() {
        return licenseId;
    }

    public void setLicenseId(String licenseId) {
        this.licenseId = licenseId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getModifiedAt() {
        return modifiedAt;
    }

    public void setModifiedAt(LocalDateTime modifiedAt) {
        this.modifiedAt = modifiedAt;
    }

    public long getTotalUsage() {
        return totalUsage;
    }

    public void setTotalUsage(long totalUsage) {
        this.totalUsage = totalUsage;
    }

    public String getConnectionTitle() {
        return connectionTitle;
    }

    public void setConnectionTitle(String connectionTitle) {
        this.connectionTitle = connectionTitle;
    }

    public String getFromInvoker() {
        return fromInvoker;
    }

    public void setFromInvoker(String fromInvoker) {
        this.fromInvoker = fromInvoker;
    }

    public String getToInvoker() {
        return toInvoker;
    }

    public void setToInvoker(String toInvoker) {
        this.toInvoker = toInvoker;
    }

    public List<OperationUsageHistoryDetail> getDetails() {
        return details;
    }

    public void setDetails(List<OperationUsageHistoryDetail> details) {
        this.details = details;
    }

    @Override
    public String toString() {
        return "OperationUsageHistory{" +
                "id=" + id +
                ", licenseId='" + licenseId + '\'' +
                ", subId='" + subId + '\'' +
                ", createdAt=" + createdAt +
                ", modifiedAt=" + modifiedAt +
                ", totalUsage=" + totalUsage +
                ", connectionTitle='" + connectionTitle + '\'' +
                ", fromInvoker='" + fromInvoker + '\'' +
                ", toInvoker='" + toInvoker + '\'' +
                ", details=" + details +
                '}';
    }
}
