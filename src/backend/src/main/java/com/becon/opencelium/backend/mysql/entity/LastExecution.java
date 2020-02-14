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

import javax.persistence.*;
import java.util.Date;

@Entity
@Table(name = "last_execution")
public class LastExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private long id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheduler_id")
    private Scheduler scheduler;

    @Column(name = "s_start_time")
    private Date successStartTime;

    @Column(name = "s_end_time")
    private Date successEndTime;

    @Column(name = "s_duration")
    private long successDuration;

    @Column(name = "s_execution_id")
    private long successExecutionId;

    @Column(name = "f_start_time")
    private Date failStartTime;

    @Column(name = "f_end_time")
    private Date failEndTime;

    @Column(name = "f_duration")
    private long failDuration;

    @Column(name = "f_execution_id")
    private long failExecutionId;

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public Scheduler getScheduler() {
        return scheduler;
    }

    public void setScheduler(Scheduler scheduler) {
        this.scheduler = scheduler;
    }

    public Date getSuccessStartTime() {
        return successStartTime;
    }

    public void setSuccessStartTime(Date successStartTime) {
        this.successStartTime = successStartTime;
    }

    public Date getSuccessEndTime() {
        return successEndTime;
    }

    public void setSuccessEndTime(Date successEndTime) {
        this.successEndTime = successEndTime;
    }

    public long getSuccessDuration() {
        return successDuration;
    }

    public void setSuccessDuration(long successDuration) {
        this.successDuration = successDuration;
    }

    public Date getFailStartTime() {
        return failStartTime;
    }

    public void setFailStartTime(Date failStartTime) {
        this.failStartTime = failStartTime;
    }

    public Date getFailEndTime() {
        return failEndTime;
    }

    public void setFailEndTime(Date failEndTime) {
        this.failEndTime = failEndTime;
    }

    public long getFailDuration() {
        return failDuration;
    }

    public void setFailDuration(long failDuration) {
        this.failDuration = failDuration;
    }

    public long getSuccessExecutionId() {
        return successExecutionId;
    }

    public void setSuccessExecutionId(long successExecutionId) {
        this.successExecutionId = successExecutionId;
    }

    public long getFailExecutionId() {
        return failExecutionId;
    }

    public void setFailExecutionId(long failExecutionId) {
        this.failExecutionId = failExecutionId;
    }
}
