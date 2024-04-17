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

package com.becon.opencelium.backend.authentication;

import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import org.springframework.http.ResponseEntity;

import java.util.List;

public class EndpointUrlAuth implements ApiAuth {

    @Override
    public List<RequestData> getAccessCredentials(Connector connector) {
        return connector.getRequestData();
    }

    @Override
    public List<RequestData> getAccessCredentials(Connector connector, ResponseEntity<?> responseEntity) {
        return connector.getRequestData();
    }
}
