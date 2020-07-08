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

import com.becon.opencelium.backend.neo4j.entity.*;
import com.becon.opencelium.backend.neo4j.repository.EnhancementNodeRepository;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingResource;
import com.becon.opencelium.backend.resource.connection.binding.LinkedFieldResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class EnhancementNodeServiceImp implements EnhancementNodeService {

    @Autowired
    private EnhancementNodeRepository enhancementNodeRepository;

    @Override
    public void save(EnhancementNode enhancementNode) {
        enhancementNodeRepository.save(enhancementNode);
    }

    @Override
    public void saveAll(List<EnhancementNode> enhancementNodes) {
        enhancementNodeRepository.saveAll(enhancementNodes);
    }

    @Override
    public Optional<EnhancementNode> findByEnhanceId(Integer enhanceId) {
        return enhancementNodeRepository.findOptionalByEnhanceId(enhanceId);
    }

    @Override
    public Optional<EnhancementNode> findByFieldId(Long fieldId) {
        return enhancementNodeRepository.findByFieldId(fieldId);
    }

    @Override
    public List<EnhancementNode> findAllByConnectionId(Long connectionId) {
        return enhancementNodeRepository.findAllByConnectionId(connectionId);
    }

    public EnhancementNode toNode(FieldBindingResource fieldBindingResource, ConnectionNode connectionNode) {
        EnhancementNode enhancementNode = new EnhancementNode();
        List<FieldNode> incomingFields = new ArrayList<>();
        List<FieldNode> outgoingFields = new ArrayList<>();

        List<MethodNode> allMethods = gatherAllMethods(connectionNode);

        incomingFields = getFieldsFromMethod(fieldBindingResource.getFrom(), allMethods);
        outgoingFields = getFieldsFromMethod(fieldBindingResource.getTo(), allMethods);


        enhancementNode.setIncomeField(incomingFields);
        enhancementNode.setOutgoingField(outgoingFields);
        return  enhancementNode;
    }

    private List<FieldNode> getFieldsFromMethod(List<LinkedFieldResource> from, List<MethodNode> allMethods) {
        List<FieldNode> fieldNodes = new ArrayList<>();
        for (LinkedFieldResource lfr : from) {
            String color = lfr.getColor();
            String type = lfr.getType();
            String field = lfr.getField();
            MethodNode methodNode = allMethods.stream().filter(m -> m.getColor().equals(color))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Method not found in connection node when building enh"));
            LinkedList<String> path = new LinkedList<>(Arrays.asList(field.split("\\.")));

            // defining body node
            BodyNode bodyNode;
            if (type.equals("response")){
                String result = path.pop();
                if (result.equals("fail")) {
                    bodyNode = methodNode.getResponseNode().getFail().getBody();
                } else {
                    bodyNode = methodNode.getResponseNode().getSuccess().getBody();
                }
            } else {
                bodyNode = methodNode.getRequestNode().getBodyNode();
            }

            FieldNode fieldNode = findField(bodyNode.getFields(), path);
            fieldNodes.add(fieldNode);
        }

        return fieldNodes;
    }

    private FieldNode findField(List<FieldNode> fieldNodes, LinkedList<String> path) {
        String fieldName = path.pop();
        for (FieldNode field : fieldNodes) {
            if (field.getName().equals(fieldName) && path.isEmpty()) {
                return field;
            }

            if (!path.isEmpty() && (field.getChild() != null) && field.getName().equals(fieldName)) {
                return findField(field.getChild(), path);
            }
        }

        throw new RuntimeException("Field not matched to path when creating enh node");
    }

    private List<MethodNode> gatherAllMethods(ConnectionNode connectionNode) {
        List<MethodNode> methodNodes = new ArrayList<>();
        MethodNode startMethod = connectionNode.getFromConnector().getStartMethod();
        OperatorNode operatorNode = connectionNode.getFromConnector().getStartOperator();
        goToMethod(startMethod, methodNodes);
        goToOperator(operatorNode, methodNodes);

        startMethod = connectionNode.getToConnector().getStartMethod();
        operatorNode = connectionNode.getToConnector().getStartOperator();
        goToMethod(startMethod, methodNodes);
        goToOperator(operatorNode, methodNodes);

        return methodNodes;
    }

    private void goToMethod(MethodNode methodNode, List<MethodNode> methodNodes) {
        if (methodNode == null) {
            return;
        }

        methodNodes.add(methodNode);

        goToMethod(methodNode.getNextFunction(), methodNodes);
        goToOperator(methodNode.getNextOperator(), methodNodes);
    }

    private void goToOperator(OperatorNode operatorNode, List<MethodNode> methodNodes) {
        if (operatorNode == null) {
            return;
        }

        goToMethod(operatorNode.getBodyFunction(), methodNodes);
        goToOperator(operatorNode.getBodyOperator(), methodNodes);

        goToMethod(operatorNode.getNextFunction(), methodNodes);
        goToOperator(operatorNode.getNextOperator(), methodNodes);
    }
}
