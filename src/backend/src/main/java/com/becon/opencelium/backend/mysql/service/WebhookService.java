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

package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.Scheduler;
import com.becon.opencelium.backend.mysql.entity.Webhook;
import com.becon.opencelium.backend.resource.webhook.WebhookResource;
import com.becon.opencelium.backend.resource.webhook.WebhookTokenResource;

import java.util.Optional;

public interface WebhookService {

    Webhook save(int userId, Scheduler schedulerId);

    String generateWebhookToken(int userId, String uuid, int schedulerId);

    String buildUrl(Webhook webhook);

    int getConnectionIdByUrl();

    Optional<Webhook> findById(int id);

    Optional<Webhook> findBySchedulerId(int id);

    Optional<Webhook> findByUIID(String uuid);

    Optional<WebhookTokenResource> getTokenObject(String token);

    void deleteById(int id);

    WebhookResource toResource(Webhook webhook);

    void deleteAllBySchedulerId(int id);

    boolean existsBySchedulerId(int id);

}
