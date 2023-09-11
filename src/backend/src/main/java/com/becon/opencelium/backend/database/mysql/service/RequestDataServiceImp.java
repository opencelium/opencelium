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

package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.database.mysql.repository.RequestDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RequestDataServiceImp implements RequestDataService{

    @Autowired
    private RequestDataRepository requestDataRepository;

    @Override
    public Optional<RequestData> findByConnectorIdAndField(int connectorId, String field) {
        return requestDataRepository.findByConnectorIdAndField(connectorId, field);
    }

    @Override
    public List<RequestData> toEntity(Map<String, String> resource) {
        return resource.entrySet().stream()
                .map(k -> new RequestData(k.getKey(), k.getValue()))
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, String> toResource(List<RequestData> requestData) {
        return requestData.stream().filter(field -> field.getVisibility().equals("public"))
                .collect(Collectors.toMap(RequestData::getField, RequestData::getValue));
    }
}
