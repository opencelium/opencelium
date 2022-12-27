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

package com.becon.opencelium.backend.resource.execution;

import com.becon.opencelium.backend.mysql.entity.LastExecution;
import jakarta.annotation.Resource;
import org.springframework.hateoas.RepresentationModel;

@Resource
public class ExecutionResource extends RepresentationModel {

    private String taId;
    private long startTime;
    private long endTime;
    private long duration;

    public ExecutionResource() {
    }

    public ExecutionResource(LastExecution lastExecution, boolean success) {
        if (success){
            this.taId = lastExecution.getScheduler().getId() + "-" + lastExecution.getSuccessExecutionId();

            if (lastExecution.getSuccessStartTime() != null){
                this.startTime = lastExecution.getSuccessStartTime().getTime();
            }

            if (lastExecution.getSuccessEndTime() != null){
                this.endTime = lastExecution.getSuccessEndTime().getTime();
            }
            this.duration = lastExecution.getSuccessDuration();
        }
        else {
            this.taId = lastExecution.getScheduler().getId() + "-" + lastExecution.getFailExecutionId();
            if (lastExecution.getFailStartTime() != null){
                this.startTime = lastExecution.getFailStartTime().getTime();
            }

            if (lastExecution.getFailEndTime() != null){
                this.endTime = lastExecution.getFailEndTime().getTime();
            }
            this.duration = lastExecution.getFailDuration();
        }
    }

    public String getTaId() {
        return taId;
    }

    public void setTaId(String taId) {
        this.taId = taId;
    }

    public long getStartTime() {
        return startTime;
    }

    public void setStartTime(long startTime) {
        this.startTime = startTime;
    }

    public long getEndTime() {
        return endTime;
    }

    public void setEndTime(long endTime) {
        this.endTime = endTime;
    }

    public long getDuration() {
        return duration;
    }

    public void setDuration(long duration) {
        this.duration = duration;
    }
}
