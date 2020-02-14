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

package com.becon.opencelium.backend.factory;

import com.becon.opencelium.backend.authentication.*;
import com.becon.opencelium.backend.invoker.InvokerContainer;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

public class AuthenticationFactory {

    private List<Invoker> invokerList;
    private RestTemplate restTemplate;

    public AuthenticationFactory(List<Invoker> invokerList, RestTemplate restTemplate) {
        this.invokerList = invokerList;
        this.restTemplate = restTemplate;
    }

    public AuthenticationType getAuthType(String authType){
        switch (authType){
            case "basic":
                return new BasicAuth(invokerList);
            case "endpointAuth":
                return new EndpointUrlAuth();
            case "token":
                return new TokenAuth(invokerList, restTemplate);
            case "apikey":
                return new ApiKeyAuth();
        }
        return null;
    }
}
