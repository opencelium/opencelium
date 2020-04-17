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

import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.resource.connection.ConnectorNodeResource;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;

public interface ConnectorService {

    Optional<Connector> findById(int id);

    void save(Connector connector);

    void saveAll(List<Connector> connectors);

    void deleteById(int id);

    boolean existById(int id);

    boolean existByTitle(String title);

    List<Connector> findAll();

    Connector toEntity(ConnectorResource resource);

    ConnectorResource toResource(Connector entity);

    ConnectorNodeResource toNodeResource(Connector entity, Long connectionId, String direction);

    ResponseEntity<?> checkCommunication(Connector connector) throws JsonProcessingException;

    List<RequestData> buildRequestData(Connector connector);
}
