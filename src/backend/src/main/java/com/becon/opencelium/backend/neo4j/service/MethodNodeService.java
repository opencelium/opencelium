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

package com.becon.opencelium.backend.neo4j.service;

import com.becon.opencelium.backend.neo4j.entity.MethodNode;

import java.util.List;
import java.util.Optional;

public interface MethodNodeService {
    Optional<MethodNode> getByFieldNodeId(Long nodeId);
    Optional<MethodNode> findById(Long id);
    Iterable<MethodNode> findAllById(List<Long> ids);
    List<MethodNode> findMethodsByConnectionIdAndConnectorId(Long connectionId, Integer id);
}
