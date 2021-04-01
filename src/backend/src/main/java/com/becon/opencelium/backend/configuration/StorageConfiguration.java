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
import com.becon.opencelium.backend.invoker.InvokerContainer;
import com.becon.opencelium.backend.invoker.entity.RequiredData;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.storage.UserStorageService;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired
    private UserStorageService userStorageService;

    @Autowired
    private ConnectorServiceImp connectorService;

    @Autowired
    private InvokerContainer invokerContainer;

    @EventListener(ApplicationReadyEvent.class)
    public void createStorageAfterStartup() {
        Path filePath = Paths.get(PathConstant.TEMPLATE);
        if (Files.notExists(filePath)){
            File directory = new File(PathConstant.TEMPLATE);
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.TEMPLATE);
        }

        filePath = Paths.get(PathConstant.ASSISTANT);
        if (Files.notExists(filePath)){
            File directory = new File(PathConstant.ASSISTANT);
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.ASSISTANT);
        }
        filePath = Paths.get(PathConstant.ASSISTANT + "application/");
        if (Files.notExists(filePath)){
            File directory = new File(PathConstant.ASSISTANT + "application/");
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.ASSISTANT + "application/");
        }
        filePath = Paths.get(PathConstant.ASSISTANT + "temporary/");
        if (Files.notExists(filePath)){
            File directory = new File(PathConstant.ASSISTANT + "temporary/");
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.ASSISTANT + "temporary/");
        }
        filePath = Paths.get(PathConstant.ASSISTANT + "zipfile/");
        if (Files.notExists(filePath)){
            File directory = new File(PathConstant.ASSISTANT + "zipfile/");
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.ASSISTANT + "zipfile/");
        }
        List<Connector> connectors = connectorService.findAll();
        connectors.forEach(c -> {
            List<RequestData> requestData = c.getRequestData();
            List<RequiredData> requiredData = invokerContainer.getByName(c.getInvoker()).getRequiredData();

            requestData.forEach(request -> {
                RequiredData required = requiredData.stream().filter(rq -> rq.getName().equals(request.getField())).findFirst().orElse(null);
                if (required == null){
                    return;
                }
                request.setVisibility(required.getVisibility());
            });
        });

        connectorService.saveAll(connectors);

        // creates storage for files
        userStorageService.init();
    }
}
