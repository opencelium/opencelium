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
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;

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

    List<Connector> findAllByInvoker(String title);

    List<Connector> findAllByTitleContains(String title);

    List<Connector> findAll();

    ResponseEntity<?> checkCommunication(Connector connector) throws JsonProcessingException;

    ResponseEntity<?> getAuthorization(Connector connector);

    List<RequestData> buildRequestData(Connector connector);

}
