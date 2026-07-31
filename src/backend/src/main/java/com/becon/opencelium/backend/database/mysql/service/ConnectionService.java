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
import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.resource.IdentifiersDTO;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.ConnectionVersionUpdateRequest;
import com.becon.opencelium.backend.resource.connection.ConnectionVersionedDTO;
import com.becon.opencelium.backend.resource.connection.masking.RuleDTO;
import com.becon.opencelium.backend.resource.webhook.WebhookParamDTO;
import com.github.fge.jsonpatch.JsonPatch;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;

public interface ConnectionService {

    Long save(Connection connection, ConnectionMng connectionMng);

    void deleteById(Long id);

    void deleteAll(List<Connection> connections);

    void deleteOnlyConnection(Long id);

    void deleteAndTrackIt(Long id);

    List<Connection> findAll();

    /**
     * @param includeTest when {@code false}, test connections are excluded from the result
     */
    List<Connection> findAll(Boolean includeTest);

    boolean existsByName(String name);

    boolean existsById(Long id);

    List<Connection> findAllByConnectorId(int connectorId);

    /**
     * @param includeTest when {@code false}, test connections are excluded from the result
     */
    List<Connection> findAllByConnectorId(int connectorId, Boolean includeTest);

    List<Connection> findAllByNameContains(String name);

    void update(Connection connection, ConnectionMng connectionMng);

    Connection getById(Long connectionId);

    Long createEmptyConnection();

    void undo(Long connectionId);

    List<Connection> getAllConnectionsNotContains(List<Long> ids);

    void patchUpdate(Long connectionId, JsonPatch patch, PatchConnectionDetails details);

    ConnectionDTO getFullConnection(Long connectionId);

    ConnectionDTO getFullConnection(Long connectionId, String snapshotId);

    List<Connection> getAllByCategoryId(Integer categoryId);

    List<ConnectionDTO> getAllFullConnection();

    /**
     * @param includeTest when {@code false}, test connections are excluded from the result
     */
    List<ConnectionDTO> getAllFullConnection(Boolean includeTest);

    void updateCategory(Connection connection, Integer newCategory);

    List<WebhookParamDTO> extractVarsFromJson(String json) throws IOException;

    List<MaskingRule> getAllRules(long connectionId);

    RuleDTO getOneRule(long connectionId, long ruleId);

    List<RuleDTO> saveRuleList(long connectionId, List<RuleDTO> dtos);

    RuleDTO saveRule(long connectionId, RuleDTO dto);

    RuleDTO updateRule(long connectionId, long ruleId, RuleDTO dto);

    void deleteRuleList(long connectionId);

    void deleteRule(long connectionId, long ruleId);

    void updateConnectionsToCurrentVersion();

    List<String> getLogFileNameListById(long connectionId);

    List<Connection> findAllByIds(IdentifiersDTO<Long> ids);

    /**
     * @param includeTest when {@code false}, test connections are excluded from the result
     */
    List<Connection> findAllByIds(IdentifiersDTO<Long> ids, Boolean includeTest);

    ConnectionServiceImp.CleanupResult cleanupAllTestConnections(Set<Long> runningConnectionIds);

    void deleteByIds(List<Long> ids, Set<Long> runningConnectionIds);

    List<ConnectionVersionedDTO> getConnectionVersions(Long connectionId);

    Map<Long, ConnectionVersionedDTO> getLastVersions(List<Connection> connections);

    void deleteSnapshot(Long connectionId, String snapshotId);

    void setInitialRevisionToConnections();

    void updateSnapshot(Long connectionId, String snapshotId, ConnectionVersionUpdateRequest request);

    void switchVersion(Long connectionId, String snapshotId);
}
