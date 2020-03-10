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

import com.becon.opencelium.backend.mysql.entity.Connection;
import com.becon.opencelium.backend.neo4j.entity.FieldNode;
import com.becon.opencelium.backend.neo4j.entity.MethodNode;
import com.becon.opencelium.backend.resource.connection.binding.LinkedFieldResource;
import com.fasterxml.jackson.core.JsonProcessingException;
import jdk.nashorn.internal.ir.FunctionNode;

import java.util.List;
import java.util.Map;

public interface FieldNodeService {

    FieldNode findFieldByResource(LinkedFieldResource fieldResource, Connection connection);
    LinkedFieldResource toLinkedFieldResource(FieldNode node);
    String getPath(MethodNode methodNode, FieldNode fieldNode);
    boolean fieldHasRequest(Long fieldId);
    boolean fieldHasSuccess(Long fieldId);
    boolean hasEnhancement(Long fieldId);
    List<FieldNode> findIncoming(Long outgoingId);
    String getFieldValue(FieldNode fieldNode);
    boolean hasReference(String fieldValue);
    boolean existsInInvokerMethod(String invoker, String method, String path);
    Map<String, Object> deleteEmptyFields(Map<String, Object> body);
    boolean valueIsJSON(String value);
}
