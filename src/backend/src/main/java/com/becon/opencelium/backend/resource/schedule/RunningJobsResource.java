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

package com.becon.opencelium.backend.resource.schedule;

import jakarta.annotation.Resource;

import java.util.Date;

@Resource
public class RunningJobsResource {
    private long connectionId;
    private int schedulerId;
    private long execId;
    private String title;
    private Date startTime;
    private double avgDuration;
    private String fromConnector;
    private String toConnector;

    public long getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(long connectionId) {
        this.connectionId = connectionId;
    }

    public int getSchedulerId() {
        return schedulerId;
    }

    public void setSchedulerId(int schedulerId) {
        this.schedulerId = schedulerId;
    }

    public long getExecId() {
        return execId;
    }

    public void setExecId(long execId) {
        this.execId = execId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Date getStartTime() {
        return startTime;
    }

    public void setStartTime(Date startTime) {
        this.startTime = startTime;
    }

    public double getAvgDuration() {
        return avgDuration;
    }

    public void setAvgDuration(double avgDuration) {
        this.avgDuration = avgDuration;
    }

    public String getFromConnector() {
        return fromConnector;
    }

    public void setFromConnector(String fromConnector) {
        this.fromConnector = fromConnector;
    }

    public String getToConnector() {
        return toConnector;
    }

    public void setToConnector(String toConnector) {
        this.toConnector = toConnector;
    }

    @Override
    public String toString() {
        return "RunningJobResource{" +
                "connectionId=" + connectionId +
                ", schedulerId=" + schedulerId +
                ", execId=" + execId +
                ", title='" + title + '\'' +
                ", startTime=" + startTime +
                ", avgDuration=" + avgDuration +
                ", fromConnector='" + fromConnector + '\'' +
                ", toConnector='" + toConnector + '\'' +
                '}';
    }
}
