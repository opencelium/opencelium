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

package com.becon.opencelium.backend.resource.webhook;


import com.becon.opencelium.backend.mysql.entity.Webhook;
import org.springframework.hateoas.RepresentationModel;

import javax.annotation.Resource;

@Resource
public class WebhookResource extends RepresentationModel{
    private int webhookId;
    private String url;

    public WebhookResource() {
    }

    public WebhookResource(Webhook webhook) {
        this.webhookId  = webhook.getId();
        this.url = webhook.getToken();
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public int getWebhookId() {
        return webhookId;
    }

    public void setWebhookId(int webhookId) {
        this.webhookId = webhookId;
    }
}
