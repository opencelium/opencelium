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

import com.becon.opencelium.backend.authentication.BasicAuth;
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.invoker.InvokerContainer;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.parser.InvokerParserImp;
import org.apache.commons.io.FilenameUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.w3c.dom.Document;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Configuration
public class InvokerConfiguration {

    private final Path filePath = Paths.get(PathConstant.INVOKER);

    @Bean
    public Map<String, Invoker> containerBean(){
        List<Document> invokers = getAllInvokers();
        Map<String, Invoker> container = new HashMap<>();
        invokers.forEach(document -> {
            InvokerParserImp parser = new InvokerParserImp(document);
            File f = new File(document.getDocumentURI());
            String invoker = FilenameUtils.removeExtension(f.getName());
            invoker = invoker.replace("%20", " ");
            container.put(invoker, parser.parse());
        });
        return container;
    }

    @Bean("invokerInit")
    public InvokerContainer invokerContainerBean(Map<String, Invoker> container) {
        return new InvokerContainer(container);
    }

    private List<Document> getAllInvokers(){
        try {
            Stream<Path> allInvokers = Files.walk(filePath, 1)
                    .filter(path -> !path.equals(filePath))
                    .map(filePath::relativize);

            return allInvokers.map(p -> new File(filePath.toString() + "/" + p.getFileName()))
                    .map(file -> {
                        try {
                            DocumentBuilder dBuilder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
                            return dBuilder.parse(file);
                        }
                        catch (Exception e){
                            throw new RuntimeException(e);
                        }
                    }).collect(Collectors.toList());
        }
        catch (IOException e) {
            throw new StorageException("Failed to read stored files", e);
        }
    }
}
