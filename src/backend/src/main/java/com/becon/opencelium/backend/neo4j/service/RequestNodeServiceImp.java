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

import com.becon.opencelium.backend.neo4j.entity.HeaderNode;
import com.becon.opencelium.backend.neo4j.entity.ItemNode;
import com.becon.opencelium.backend.neo4j.entity.RequestNode;
import com.becon.opencelium.backend.resource.connector.RequestResource;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RequestNodeServiceImp implements RequestNodeService{

    public static RequestResource toResource(RequestNode requestNode) {
        if (requestNode == null){
            return null;
        }
        RequestResource requestResource = new RequestResource();
        requestResource.setEndpoint(requestNode.getEndpoint());
        requestResource.setMethod(requestNode.getMethod());
        if (requestNode.getBodyNode() != null){
            requestResource.setBody(BodyNodeServiceImp.toResource(requestNode.getBodyNode()));
        }
        requestResource.setHeader(convertHeaderNodeToMap(requestNode.getHeaderNode()));
        return requestResource;
    }

    private static Map<String, String> convertHeaderNodeToMap(HeaderNode headerNode){
        if (headerNode == null || headerNode.getItems() == null || headerNode.getItems().isEmpty()) {
            return null;
        }

        return headerNode.getItems().stream().collect(Collectors.toMap(ItemNode::getName, ItemNode::getValue));
    }
}
