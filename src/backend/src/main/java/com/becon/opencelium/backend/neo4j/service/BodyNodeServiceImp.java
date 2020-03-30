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

import com.becon.opencelium.backend.neo4j.entity.BodyNode;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class BodyNodeServiceImp implements BodyNodeService {

    public static Map<String, Object> toResource(BodyNode entity){
        return FieldNodeServiceImp.toResource(entity.getFields());
    }

    @Override
    public String toJson(BodyNode bodyNode) {
        bodyNode.getFields();
        return null;
    }
}
