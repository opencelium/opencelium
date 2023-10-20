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

package com.becon.opencelium.backend.mysql.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.LazyCollection;
import org.hibernate.annotations.LazyCollectionOption;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.*;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "scheduler")
@EntityListeners(AuditingEntityListener.class)
public class Scheduler {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "title")
    private String title;

    @Column(name = "status")
    private boolean status;

    @Column(name = "debug_mode")
    private boolean debugMode;

    @Column(name = "cron_exp")
    private String cronExp;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private Integer createdBy;

    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_on", updatable = false)
    private Date createdOn;

    @LastModifiedBy
    @Column(name = "modified_by")
    private Integer modifiedBy;

    @UpdateTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "modified_on")
    private Date modifiedOn;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "connection_id")
    private Connection connection;

    @OneToOne(mappedBy = "scheduler", fetch = FetchType.EAGER, cascade = {CascadeType.REMOVE})
    private Webhook webhook;

    @JsonIgnore
    @OneToOne(mappedBy = "scheduler", fetch = FetchType.EAGER, cascade = CascadeType.REMOVE)
    private LastExecution lastExecution;

    @OneToMany(mappedBy = "scheduler", fetch = FetchType.LAZY, cascade = CascadeType.REMOVE)
    private List<Execution> executions;

    @LazyCollection(LazyCollectionOption.FALSE)
    @OneToMany(mappedBy = "scheduler", cascade = CascadeType.REMOVE)
    private List<EventNotification> eventNotifications;


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

    public boolean getStatus() {
        return status;
    }

    public void setStatus(boolean status) {
        this.status = status;
    }

    public boolean getDebugMode() {
        return debugMode;
    }

    public void setDebugMode(boolean debugMode) {
        this.debugMode = debugMode;
    }

    public String getCronExp() {
        return cronExp;
    }

    public void setCronExp(String cronExp) {
        this.cronExp = cronExp;
    }

    public Integer getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Integer createdBy) {
        this.createdBy = createdBy;
    }

    public Date getCreatedOn() {
        return createdOn;
    }

    public void setCreatedOn(Date createdOn) {
        this.createdOn = createdOn;
    }

    public Integer getModifiedBy() {
        return modifiedBy;
    }

    public void setModifiedBy(Integer modifiedBy) {
        this.modifiedBy = modifiedBy;
    }

    public Date getModifiedOn() {
        return modifiedOn;
    }

    public void setModifiedOn(Date modifiedOn) {
        this.modifiedOn = modifiedOn;
    }

    public Connection getConnection() {
        return connection;
    }

    public void setConnection(Connection connection) {
        this.connection = connection;
    }

    public boolean isStatus() {
        return status;
    }

    public Webhook getWebhook() {
        return webhook;
    }

    public void setWebhook(Webhook webhook) {
        this.webhook = webhook;
    }

    public LastExecution getLastExecution() {
        return lastExecution;
    }

    public void setLastExecution(LastExecution lastExecution) {
        this.lastExecution = lastExecution;
    }

    public List<Execution> getExecutions() {
        return executions;
    }

    public void setExecutions(List<Execution> executions) {
        this.executions = executions;
    }

    public List<EventNotification> getEventNotifications() { return eventNotifications; }

    public void setEventNotifications(List<EventNotification> eventNotifications) { this.eventNotifications = eventNotifications; }
}
