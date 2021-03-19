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

        filePath = Paths.get(PathConstant.REPOSITORY);
        if (Files.notExists(filePath)){
            File directory = new File(PathConstant.REPOSITORY);
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.REPOSITORY);
        }
        filePath = Paths.get(PathConstant.REPOSITORY + "application/");
        if (Files.notExists(filePath)){
            File directory = new File(PathConstant.REPOSITORY + "application/");
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.REPOSITORY + "application/");
        }
        filePath = Paths.get(PathConstant.REPOSITORY + "connection/");
        if (Files.notExists(filePath)){
            File directory = new File(PathConstant.REPOSITORY + "connection/");
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.REPOSITORY + "connection/");
        }
        filePath = Paths.get(PathConstant.REPOSITORY + "invoker/");
        if (Files.notExists(filePath)){
            File directory = new File(PathConstant.REPOSITORY + "invoker/");
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.REPOSITORY + "invoker/");
        }
        filePath = Paths.get(PathConstant.REPOSITORY + "template/");
        if (Files.notExists(filePath)){
            File directory = new File(PathConstant.REPOSITORY + "template/");
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.REPOSITORY + "template/");
        }
        filePath = Paths.get(PathConstant.REPOSITORY + "zipfile/");
        if (Files.notExists(filePath)){
            File directory = new File(PathConstant.REPOSITORY + "zipfile/");
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.REPOSITORY + "zipfile/");
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
