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

import com.becon.opencelium.backend.neo4j.entity.ConnectorNode;
import com.becon.opencelium.backend.neo4j.entity.StatementNode;
import com.becon.opencelium.backend.neo4j.repository.OperatorNodeRepository;
import com.becon.opencelium.backend.resource.connection.ConditionResource;
import com.becon.opencelium.backend.resource.connection.MethodResource;
import com.becon.opencelium.backend.resource.connection.OperatorResource;
import com.becon.opencelium.backend.utility.ActionUtility;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OperatorNodeServiceImp implements OperatorNodeService {

    @Autowired
    private OperatorNodeRepository operatorNodeRepository;

    @Autowired
    private ActionUtility actionUtility;

    public StatementNode toEntity(List<MethodResource> methodResources, List<OperatorResource> operatorResources,
                                  ConnectorNode connectorNode, String connectionName){

        return actionUtility.buildOperatorEntity(methodResources, operatorResources, connectorNode, connectionName);
    }

    public static OperatorResource toResource(StatementNode entity){
        OperatorResource operatorResource = new OperatorResource();
        operatorResource.setIndex(entity.getIndex());
//        operatorResource.setNodeId(entity.getId());
        operatorResource.setType(entity.getType());
        operatorResource.setIterator(entity.getIterator());
        operatorResource.setCondition(new ConditionResource(entity));
        //TODO: convert ot condition type in enhancement
        return operatorResource;
    }

    @Override
    public List<StatementNode> findOperatorsByConnectionIdAndConnectorId(Long connectionId, String direction, Integer connectorId) {
        if (direction.equals("to_connector")){
            return operatorNodeRepository.findToOperatorByConnectionIdAndConnectorId(connectionId, connectorId);
        } else {
            return operatorNodeRepository.findFromOperatorByConnectionIdAndConnectorId(connectionId, connectorId);
        }
    }
}
