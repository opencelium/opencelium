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

import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.entity.RequiredData;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import org.springframework.http.ResponseEntity;

import java.util.Base64;
import java.util.List;

public class BasicAuth implements ApiAuth {

    private final Invoker invoker;

    public BasicAuth(Invoker invoker){
        this.invoker = invoker;
    }

    @Override
    public List<RequestData> getAccessCredentials(Connector connector, ResponseEntity<?> responseEntity) {
        return connector.getRequestData();
    }

    @Override
    public List<RequestData> getAccessCredentials(Connector connector) {
        List<RequestData> requestDataList = connector.getRequestData();
        RequiredData requiredData = invoker.getRequiredData().stream()
                        .filter(data -> data.getName().equals("token"))
                        .findFirst().orElseThrow(()-> new RuntimeException("Token property not found in request_data"));
        String token = requiredData.getValue();

        int openBrace = token.indexOf("{") + 1;
        int closeBrace = token.indexOf("}");
        String data = token.substring(openBrace, closeBrace);
        String[] credentials = data.split(":");
        String username = requestDataList.stream()
                .filter(d -> d.getField().equals(credentials[0]))
                .findFirst()
                .orElseThrow(() -> new RuntimeException(credentials[0] + "property not found in request_data")).getValue();
        String password = requestDataList.stream()
                .filter(d -> d.getField().equals(credentials[1]))
                .findFirst()
                .orElseThrow(() -> new RuntimeException(credentials[1] + "property not found in request_data")).getValue();
        String authCode = "Basic " + Base64.getEncoder().encodeToString((username + ":" + password).getBytes());

        RequestData requestData = new RequestData(requiredData);
        requestData.setValue(authCode);
        requestDataList.add(requestData);
        return requestDataList;
    }
}
