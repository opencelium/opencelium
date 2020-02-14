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
import com.becon.opencelium.backend.neo4j.repository.MethodNodeRepository;
import com.becon.opencelium.backend.resource.connection.MethodResource;
import com.becon.opencelium.backend.resource.connection.OperatorResource;
import com.becon.opencelium.backend.utility.ActionUtility;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MethodNodeServiceImp implements MethodNodeService {

    @Autowired
    private MethodNodeRepository methodNodeRepository;

    @Autowired
    private ActionUtility actionUtility;


    public MethodNode toEntity(List<MethodResource> functionResources, List<OperatorResource> operatorResources, String invokerName) {
        return actionUtility.buildMethodEntity(functionResources, operatorResources, invokerName);
    }

    public static MethodResource toResource(MethodNode methodNode){
        MethodResource methodResource = new MethodResource();
        methodResource.setIndex(methodNode.getIndex());
        methodResource.setColor(methodNode.getColor());
        methodResource.setName(methodNode.getName());
        methodResource.setNodeId(methodNode.getId());

        methodResource.setRequest(RequestNodeServiceImp.toResource(methodNode.getRequestNode()));
        methodResource.setResponse(ResponseNodeServiceImp.toResource(methodNode.getResponseNode()));

        return methodResource;
    }

    @Override
    public Optional<MethodNode> getByFieldNodeId(Long fieldNodeId) {
        return methodNodeRepository.findByFieldNodeId(fieldNodeId);
    }

    @Override
    public Optional<MethodNode> findById(Long id) {
        return methodNodeRepository.findById(id);
    }

    @Override
    public Iterable<MethodNode> findAllById(List<Long> ids) {
        return methodNodeRepository.findAllById(ids, -1);
    }

    @Override
    public List<MethodNode> findMethodsByConnectionIdAndConnectorId(Long connectionId, Integer connectorId) {
        return methodNodeRepository.findMethodsByConnectionIdAndConnectorId(connectionId, connectorId);
    }
}
