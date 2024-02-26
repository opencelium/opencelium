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

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.github.fge.jsonpatch.JsonPatch;

import java.util.List;
import java.util.Optional;

public interface ConnectionService {

    ConnectionMng save(Connection connection, ConnectionMng connectionMng);

    void deleteById(Long id);

    void deleteOnlyConnection(Long id);

    void deleteAndTrackIt(Long id);

    Optional<Connection> findById(Long id);

    List<Connection> findAll();

    boolean existsByName(String name);

    boolean existsById(Long id);

    List<Connection> findAllByConnectorId(int connectorId);

    List<Connection> findAllByNameContains(String name);

    void update(Connection connection, ConnectionMng connectionMng);

    Connection getById(Long connectionId);

    Long createEmptyConnection();

    void undo(Long connectionId);

    List<Connection> getAllConnectionsNotContains(List<Long> ids);

    void patchUpdate(Long connectionId, JsonPatch patch, PatchConnectionDetails details);

    ConnectionDTO getFullConnection(Long connectionId);

    List<ConnectionDTO> getAllFullConnection();
}
