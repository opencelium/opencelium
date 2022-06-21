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
import com.jayway.jsonpath.JsonPath;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;


public class TokenAuth implements ApiAuth {

    private final Invoker invoker;
    private RestTemplate restTemplate;

    public TokenAuth(Invoker invoker){
        this.invoker = invoker;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public List<RequestData> getAccessCredentials(Connector connector) {
        return connector.getRequestData();
    }

    @Override
    public List<RequestData> getAccessCredentials(Connector connector, ResponseEntity<?> responseEntity) {
        RequiredData requiredData = invoker.getRequiredData().stream().filter(i -> i.getName().equals("token"))
                .findFirst().orElseThrow(() -> new RuntimeException("field not found"));

        if (!requiredData.getValue().contains("%")){
            return connector.getRequestData();
        }

        List<RequestData> requestDataList = connector.getRequestData();
        RequestData requestData = new RequestData(requiredData);
        String token = getValueFromResponse(responseEntity, requiredData);
        requestData.setValue(token);
        requestDataList.add(requestData);
        return requestDataList;
    }

    private String getValueFromResponse(ResponseEntity<?> responseEntity, RequiredData requiredData){

        int openBrace = requiredData.getValue().indexOf("{") + 1;
        int closeBrace = requiredData.getValue().indexOf("}");
        String tokenRef = requiredData.getValue().substring(openBrace, closeBrace);
        List<String> tokenRefParts = new ArrayList<>(Arrays.asList(tokenRef.split("\\.")));
        boolean isHeader = tokenRefParts.get(0).contains("header");
        tokenRefParts.remove(0); // remove header or body identifier

        if (isHeader) {
            HttpHeaders httpHeaders = responseEntity.getHeaders();
            return httpHeaders.get(tokenRefParts.get(0)).get(0);
        }

        if(tokenRef.equals("body")){
            return responseEntity.getBody().toString().replace("\"", "");// TODO replaced " to empty when body is just string
        }


        String path = tokenRefParts.stream().map(Object::toString).collect(Collectors.joining("."));
        String body = responseEntity.getBody().toString();
        return JsonPath.read(body, path);
    }
}
