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

package com.becon.opencelium.backend.resource.request;

import com.becon.opencelium.backend.resource.notification.NotificationResource;
import org.springframework.hateoas.ResourceSupport;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

@Resource
public class SchedulerRequestResource extends ResourceSupport {

    private int schedulerId;
    private Long connectionId;
    private String title;
    private boolean status;
    private String cronExp;
    private boolean debugMode;

    private List<NotificationResource> notificationResources = new ArrayList<>();

    public int getSchedulerId() {
        return schedulerId;
    }

    public void setSchedulerId(int schedulerId) {
        this.schedulerId = schedulerId;
    }

    public Long getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(Long connectionId) {
        this.connectionId = connectionId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public boolean isStatus() {
        return status;
    }

    public void setStatus(boolean status) {
        this.status = status;
    }

    public String getCronExp() {
        return cronExp;
    }

    public void setCronExp(String cronExp) {
        this.cronExp = cronExp;
    }

    public boolean isDebugMode() {
        return debugMode;
    }

    public void setDebugMode(boolean debugMode) {
        this.debugMode = debugMode;
    }

    public List<NotificationResource> getNotificationResources() {
        return notificationResources;
    }

    public void setNotificationResources(List<NotificationResource> notificationResources) {
        this.notificationResources = notificationResources;
    }
}
