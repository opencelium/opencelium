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

package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.enums.ConnectorStatus;
import com.becon.opencelium.backend.execution.logger.mapper.ParsedLogLineMapper;
import com.becon.opencelium.backend.resource.IdentifiersDTO;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public interface ConnectorService {

    Optional<Connector> findById(int id);
    Connector getById(Integer id);

    Connector save(Connector connector);

    void saveAll(List<Connector> connectors);

    void deleteById(int id);

    void deleteByInvoker(String invokerName);

    boolean existsById(int id);

    boolean existByTitle(String title);

    boolean existByInvoker(String invokerName);

    List<Connector> findAllByInvoker(String invokerName);

    List<Connector> findAllByTitleContains(String title);

    List<Connector> findAll();

    ResponseEntity<?> checkCommunication(Connector connector) throws JsonProcessingException;

    /**
     * Persists the health status of the most recent remote-API check on a saved connector.
     * The error is cleared when the status is {@link ConnectorStatus#UP}.
     */
    void updateStatus(int connectorId, ConnectorStatus status, String error);

    /**
     * Persists the time of the most recent health check without touching the status.
     */
    void updateLastCheckedAt(int connectorId, Date checkedAt);

    ResponseEntity<?> getAuthorization(Connector connector);

    List<RequestData> buildRequestData(Connector connector);

    Connector update(Integer connectorId, ConnectorResource connectorResource);

    /**
     * Stores the given image as the icon of the connector, replacing (and removing from
     * storage) any previously stored icon. Returns the updated connector.
     */
    Connector storeIcon(int connectorId, MultipartFile file);

    /**
     * Removes the connector's icon from storage and clears the icon reference on the connector.
     */
    void deleteIcon(int connectorId);

    void updateRequestData(Integer connectorId, Map<String, String> requestData);

    void verifyMasterPassword(String masterPassword);

    Optional<Connector> findAllByTitle(String title);

    Boolean existsMasterPassword();

    List<Connector> findByIds(IdentifiersDTO<Integer> ids);

    List<Connector> getAllById(Set<Integer> ids);
}
