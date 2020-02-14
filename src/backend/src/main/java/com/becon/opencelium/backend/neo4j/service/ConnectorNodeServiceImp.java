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

import com.becon.opencelium.backend.neo4j.entity.ConnectorNode;
import com.becon.opencelium.backend.resource.connection.ConnectorNodeResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ConnectorNodeServiceImp implements ConnectorNodeService {

    @Autowired
    private MethodNodeServiceImp methodNodeServiceImp;

    @Autowired
    private OperatorNodeServiceImp operatorNodeServiceImp;

    public ConnectorNode toEntity(ConnectorNodeResource resource){
        ConnectorNode connectorNode = new ConnectorNode();
        connectorNode.setConnectorId(resource.getConnectorId());
        connectorNode.setName(resource.getInvoker().getName());
        connectorNode.setConnectorId(resource.getConnectorId());
        connectorNode.setStartMethod(methodNodeServiceImp.toEntity(resource.getMethods(), resource.getOperators(), resource.getInvoker().getName()));
        connectorNode.setStartOperator(operatorNodeServiceImp.toEntity(resource.getMethods(), resource.getOperators(), resource.getInvoker().getName()));
        return connectorNode;
    }

    public static ConnectorNodeResource toResource(ConnectorNode entity){
        return new ConnectorNodeResource();
    }
}
