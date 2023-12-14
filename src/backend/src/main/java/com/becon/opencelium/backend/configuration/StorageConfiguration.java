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

package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.database.mysql.service.RequestDataService;
import com.becon.opencelium.backend.invoker.InvokerContainer;
import com.becon.opencelium.backend.invoker.entity.RequiredData;
import com.becon.opencelium.backend.storage.UserStorageService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Configuration
public class StorageConfiguration {

    private final UserStorageService userStorageService;

    private final ConnectorService connectorService;

    private final InvokerContainer invokerContainer;
    private final RequestDataService requestDataService;

    public StorageConfiguration(
            UserStorageService userStorageService,
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("requestDataServiceImp") RequestDataService requestDataService,
            InvokerContainer invokerContainer
    ) {
        this.userStorageService = userStorageService;
        this.connectorService = connectorService;
        this.invokerContainer = invokerContainer;
        this.requestDataService = requestDataService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void createStorageAfterStartup() {
        Path filePath = Paths.get(PathConstant.TEMPLATE);
        if (Files.notExists(filePath)) {
            File directory = new File(PathConstant.TEMPLATE);
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.TEMPLATE);
        }

        filePath = Paths.get(PathConstant.ASSISTANT);
        if (Files.notExists(filePath)) {
            File directory = new File(PathConstant.ASSISTANT);
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.ASSISTANT);
        }
        filePath = Paths.get(PathConstant.ASSISTANT + "versions/");
        if (Files.notExists(filePath)) {
            File directory = new File(PathConstant.ASSISTANT + "versions/");
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.ASSISTANT + "versions/");
        }
        filePath = Paths.get(PathConstant.ASSISTANT + "temporary/");
        if (Files.notExists(filePath)) {
            File directory = new File(PathConstant.ASSISTANT + "temporary/");
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.ASSISTANT + "temporary/");
        }
//        filePath = Paths.get(PathConstant.ASSISTANT + "zipfile/");
//        if (Files.notExists(filePath)){
//            File directory = new File(PathConstant.ASSISTANT + "zipfile/");
//            directory.mkdir();
//            System.out.println("Directory has been created: " + PathConstant.ASSISTANT + "zipfile/");
//        }

        requestDataService.prepare();
        List<Connector> connectors = connectorService.findAll();
        connectors.forEach(c -> {
            List<RequestData> requestData = c.getRequestData();
            if (requestData != null && !requestData.isEmpty()) {
                List<RequiredData> requiredData = invokerContainer.getByName(c.getInvoker()).getRequiredData();
                requestData.forEach(request -> {
                    RequiredData required = requiredData.stream().filter(rq -> rq.getName().equals(request.getField())).findFirst().orElse(null);
                    if (required == null) {
                        return;
                    }
                    request.setVisibility(required.getVisibility());
                });
            }
        });

        connectorService.saveAll(connectors);
        // creates storage for files
        userStorageService.init();

        // create defou
    }
}
