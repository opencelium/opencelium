/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.database.mysql.entity;

import com.becon.opencelium.backend.enums.ConnectorStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "connector")
@EntityListeners(AuditingEntityListener.class)
public class Connector {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @NotNull
    @NotEmpty
    @Column(name = "title")
    private String title;

    @NotEmpty
    @NotNull
    @Column(name = "invoker")
    private String invoker;

    @Column(name = "description")
    private String description;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private Integer createdBy;

    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", updatable = false)
    private Date createdAt;

    @LastModifiedBy
    @Column(name = "modified_by")
    private Integer modifiedBy;

    @UpdateTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "modified_at")
    private Date modifiedAt;

    @Column(name = "icon")
    private String icon;

    @Column(name = "trust_certificate")
    private boolean trustCertificate;

    // millisecond
    @Column(name = "timeout")
    private int timeout;

    // Health status determined by the most recent communication check. Defaults to UNKNOWN so
    // inserts of never-checked connectors satisfy the column's NOT NULL constraint.
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ConnectorStatus status = ConnectorStatus.UNKNOWN;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "last_checked_at")
    private Date lastCheckedAt;

    // Remote error message from the last failed test; null when passed or never tested.
    @Column(name = "last_test_error", columnDefinition = "TEXT")
    private String lastTestError;

    @OneToMany(mappedBy = "connector", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<RequestData> requestData = new ArrayList<>();

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getInvoker() {
        return invoker;
    }

    public void setInvoker(String invoker) {
        this.invoker = invoker;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Integer createdBy) {
        this.createdBy = createdBy;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getModifiedBy() {
        return modifiedBy;
    }

    public void setModifiedBy(Integer modifiedBy) {
        this.modifiedBy = modifiedBy;
    }

    public Date getModifiedAt() {
        return modifiedAt;
    }

    public void setModifiedAt(Date modifiedAt) {
        this.modifiedAt = modifiedAt;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public boolean isTrustCertificate() {
        return trustCertificate;
    }

    public void setTrustCertificate(boolean trustCertificate) {
        this.trustCertificate = trustCertificate;
    }

    public int getTimeout() {
        return timeout;
    }

    public void setTimeout(int timeout) {
        this.timeout = timeout;
    }

    public ConnectorStatus getStatus() {
        return status;
    }

    public void setStatus(ConnectorStatus status) {
        this.status = status;
    }

    public Date getLastCheckedAt() {
        return lastCheckedAt;
    }

    public void setLastCheckedAt(Date lastCheckedAt) {
        this.lastCheckedAt = lastCheckedAt;
    }

    public String getLastTestError() {
        return lastTestError;
    }

    public void setLastTestError(String lastTestError) {
        this.lastTestError = lastTestError;
    }

    public List<RequestData> getRequestData() {
        return requestData;
    }

    public void setRequestData(List<RequestData> requestData) {
        this.requestData = requestData;
    }
}
