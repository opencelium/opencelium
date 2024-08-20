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
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.w3c.dom.Document;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@Configuration
public class InvokerConfiguration {

    private final Path filePath = Paths.get(PathConstant.INVOKER);

    @Bean
    public Map<String, Invoker> containerBean(@Qualifier("invokerServiceImp") InvokerService invokerService){
        if (Files.notExists(filePath)){
            File directory = new File(PathConstant.INVOKER);
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.INVOKER);
        }
        List<Document> invokers = invokerService.getAllInvokerDocuments();
        return invokerService.containerize(invokers);
    }
}
