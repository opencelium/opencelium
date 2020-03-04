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

import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.mysql.entity.Connection;
import com.becon.opencelium.backend.mysql.entity.Enhancement;
import com.becon.opencelium.backend.mysql.entity.User;
import com.becon.opencelium.backend.mysql.service.EnhancementServiceImp;
import com.becon.opencelium.backend.neo4j.entity.ConnectionNode;
import com.becon.opencelium.backend.neo4j.entity.EnhancementNode;
import com.becon.opencelium.backend.neo4j.entity.FieldNode;
import com.becon.opencelium.backend.neo4j.entity.MethodNode;
import com.becon.opencelium.backend.neo4j.repository.ConnectionNodeRepository;
import com.becon.opencelium.backend.resource.connection.ConnectionResource;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingResource;
import com.becon.opencelium.backend.security.UserPrincipals;
import com.becon.opencelium.backend.validation.connection.ValidationContext;
import com.becon.opencelium.backend.validation.connection.entity.ErrorMessageData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import javax.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ConnectionNodeServiceImp implements ConnectionNodeService{

    @Autowired
    private ConnectionNodeRepository connectionNodeRepository;

    @Autowired
    private EnhancementServiceImp enhancementService;

    @Autowired
    private FieldNodeServiceImp fieldNodeService;

    @Autowired
    private MethodNodeServiceImp methodNodeServiceImp;

    @Autowired
    private ConnectorNodeServiceImp connectorNodeServiceImp;

    @Autowired
    private InvokerServiceImp invokerServiceImp;

    @Autowired
    private ValidationContext validationContext;

    @Override
    public void save(ConnectionNode connectionNode) {
        connectionNodeRepository.save(connectionNode);
    }

    @Override
    public void deleteById(Long id) {
        connectionNodeRepository.deleteById(id);
    }

    @Override
    public Optional<ConnectionNode> findByConnectionId(Long id) {
        return connectionNodeRepository.findByConnectionId(id);
    }

    @Override
    public List<EnhancementNode> buildEnhancementNodes(List<FieldBindingResource> enhanceResource, Connection connection) {
        List<EnhancementNode> enhancementNodes = new ArrayList<>();
        List<Enhancement> enhancements = new ArrayList<>();
        enhanceResource.forEach(e -> {
            if (e.getEnhancement() == null){
                return;
            }
            Enhancement enhancement = enhancementService.toEntity(e.getEnhancement());
            enhancement.setConnection(connection);
            enhancementService.save(enhancement);
            enhancements.add(enhancement);

            List<FieldNode> toFields = e.getTo().stream()
                    .map(f -> fieldNodeService.findFieldByResource(f, connection.getId())).collect(Collectors.toList());

            List<FieldNode> fromFields = e.getFrom().stream()
                    .map(f -> fieldNodeService.findFieldByResource(f, connection.getId())).collect(Collectors.toList());

            MethodNode methodNode = methodNodeServiceImp.getByFieldNodeId(fromFields.get(0).getId())
                    .orElseThrow(() -> new RuntimeException("METHOD_NOT_FOUND_FOR_FIELD"));
            ErrorMessageData messageData = validationContext.get(connection.getName());
            if (messageData == null){
                messageData = new ErrorMessageData();
                validationContext.put(connection.getName(), messageData);
            }

            messageData.setConnectorId(connection.getFromConnector());
            messageData.setIndex(methodNode.getIndex());
            messageData.setLocation("enhancement");


            EnhancementNode enhancementNode = new EnhancementNode();
            enhancementNode.setEnhanceId(enhancement.getId());
            enhancementNode.setName(enhancement.getName());
            enhancementNode.setIncomeField(fromFields);
            enhancementNode.setOutgoingField(toFields);
            enhancementNodes.add(enhancementNode);
        });
        connection.setEnhancements(enhancements);
        return enhancementNodes;
    }

    public ConnectionNode toEntity(ConnectionResource resource) {
        ConnectionNode connectionNode = new ConnectionNode();
        connectionNode.setId(resource.getNodeId());
        connectionNode.setConnectionId(resource.getConnectionId());
        connectionNode.setName(resource.getTitle());
        connectionNode.setFromConnector(connectorNodeServiceImp.toEntity(resource.getFromConnector(), resource.getTitle()));
        connectionNode.setToConnector(connectorNodeServiceImp.toEntity(resource.getToConnector(), resource.getTitle()));
        return connectionNode;
    }

    public static ConnectionResource toResource(ConnectionNode entity) {
        return null;
    }
}
