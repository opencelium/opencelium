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

package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.invoker.InvokerContainer;
import com.becon.opencelium.backend.invoker.entity.RequiredData;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.mysql.service.ConnectorService;
import com.becon.opencelium.backend.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.storage.UserStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;

import java.util.List;

@Configuration
public class StorageConfiguration {

    @Autowired
    private UserStorageService userStorageService;

    @Autowired
    private ConnectorServiceImp connectorService;

    @Autowired
    private InvokerContainer invokerContainer;

    @EventListener(ApplicationReadyEvent.class)
    public void createStorageAfterStartup() {
        List<Connector> connectors = connectorService.findAll();
        connectors.forEach(c -> {
            List<RequestData> requestData = c.getRequestData();
            List<RequiredData> requiredData = invokerContainer.getByName(c.getInvoker()).getRequiredData();

            requestData.forEach(request -> {
                RequiredData required = requiredData.stream().filter(rq -> rq.getName().equals(request.getField())).findFirst().get();
                request.setVisibility(required.getVisibility());
            });
        });

        connectorService.saveAll(connectors);

        // creates storage for files
        userStorageService.init();
    }
}
