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

import com.becon.opencelium.backend.mysql.entity.Connection;
import com.becon.opencelium.backend.resource.connection.ConnectionResource;
import com.becon.opencelium.backend.resource.execution.LastExecutionResource;
import com.becon.opencelium.backend.resource.webhook.WebhookResource;

public class SchedulerResource {

    private int schedulerId;
    private ConnectionResource connection;
    private String title;
    private boolean status;
    private String cronExp;
    private LastExecutionResource lastExecution;
    private WebhookResource webhook;

    public int getSchedulerId() {
        return schedulerId;
    }

    public void setSchedulerId(int schedulerId) {
        this.schedulerId = schedulerId;
    }

    public ConnectionResource getConnection() {
        return connection;
    }

    public void setConnection(ConnectionResource connection) {
        this.connection = connection;
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

    public LastExecutionResource getLastExecution() {
        return lastExecution;
    }

    public void setLastExecution(LastExecutionResource lastExecution) {
        this.lastExecution = lastExecution;
    }

    public WebhookResource getWebhook() {
        return webhook;
    }

    public void setWebhook(WebhookResource webhook) {
        this.webhook = webhook;
    }
}
