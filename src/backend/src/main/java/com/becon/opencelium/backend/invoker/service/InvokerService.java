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

package com.becon.opencelium.backend.invoker.service;

import com.becon.opencelium.backend.invoker.InvokerContainer;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.resource.connector.InvokerResource;

import java.util.List;
import java.util.Map;

public interface InvokerService {

    Invoker toEntity(InvokerResource resource);

    InvokerResource toResource(Invoker entity);

    FunctionInvoker getTestFunction(String invokerName);

    Invoker findByName(String name);

    boolean existsByName(String name);

    List<Invoker> findAll();

    void delete(String name);

    String findFieldType(String name, String methodName, String exchangeType, String result, String fieldName);

    String findFieldByPath(String invoker, String method, String path);

//    Object findField(String field, Map<String, Object> body);
}
