/*
 * // Copyright (C) <2019> <becon GmbH>
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

import com.becon.opencelium.backend.neo4j.entity.OperatorNode;
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

    public OperatorNode toEntity(List<MethodResource> methodResources, List<OperatorResource> operatorResources, String invokerName){

        return actionUtility.buildOperatorEntity(methodResources, operatorResources, invokerName);
    }

    public static OperatorResource toResource(OperatorNode entity){
        OperatorResource operatorResource = new OperatorResource();
        operatorResource.setIndex(entity.getIndex());
        operatorResource.setNodeId(entity.getId());
        operatorResource.setType(entity.getType());
        operatorResource.setCondition(new ConditionResource(entity));
        //TODO: convert ot condition type in enhancement
        return operatorResource;
    }

    @Override
    public List<OperatorNode> findOperatorsByConnectionIdAndConnectorId(Long connectionId, Integer connectorId) {
        return operatorNodeRepository.findOperatorByConnectionIdAndConnectorId(connectionId, connectorId);
    }
}
