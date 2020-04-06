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

package com.becon.opencelium.backend.template.service;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.exception.WrongEncode;
import com.becon.opencelium.backend.resource.template.TemplateResource;
import com.becon.opencelium.backend.template.entity.Template;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.io.FilenameUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class TemplateServiceImp implements TemplateService {

    @Override
    public TemplateResource toResource(Template template) {
        final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        final String templatePath = uri.getScheme() + "://" + uri.getAuthority() + "/api/template/";
        TemplateResource templateResource = new TemplateResource();
        templateResource.setName(template.getName());
        templateResource.setTemplateId(template.getTemplateId());
        templateResource.setDescription(template.getDescription());
        templateResource.setConnection(template.getConnection());
        templateResource.setLink(templatePath + template.getTemplateId());
        return templateResource;
    }

    @Override
    public Template toEntity(TemplateResource templateResource) {
        Template template = new Template();
        template.setName(templateResource.getName());
        template.setTemplateId(templateResource.getTemplateId());
        template.setDescription(templateResource.getDescription());
        template.setConnection(templateResource.getConnection());
        return template;
    }

    @Override
    public void save(Template template) {
        try {
            String id = UUID.randomUUID().toString();
            String filename = id + ".json";
            ObjectMapper objectMapper = new ObjectMapper();
            template.setTemplateId(id);
            String json = objectMapper.writeValueAsString(template);
            FileWriter jsonTemplate = new FileWriter(PathConstant.TEMPLATE + filename);
            jsonTemplate.write(json);
            jsonTemplate.close();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public List<Template> findByFromInvokerAndToInvoker(String fromInvoker, String toInvoker) {
        List<Template> result = new ArrayList<>();
        getAll().forEach(t -> {
            if (t == null){
                return;
            }
            if (t.getConnection().getFromConnector().getInvoker().getName().equals(fromInvoker) &&
                    t.getConnection().getToConnector().getInvoker().getName().equals(toInvoker)){
                result.add(t);
            }
        });
        return result;
    }

    @Override
    public List<Template> findAll() {
        return getAll();
    }

    @Override
    public void deleteById(String templateId) {
        String path = PathConstant.TEMPLATE + templateId.concat(".json");
        File file = new File(path);
        if (!file.delete()){
            throw new RuntimeException("FILE_NOT_DELETED");
        }
    }

    @Override
    public Optional<Template> findById(String id) {
        StringBuilder contentBuilder = new StringBuilder();
        try (Stream<String> stream = Files
                .lines( Paths.get(PathConstant.TEMPLATE + id.concat(".json")), StandardCharsets.UTF_8)) {

            stream.forEach(s -> contentBuilder.append(s).append("\n"));
        } catch (IOException e) {
            e.printStackTrace();
        }

        ObjectMapper objectMapper = new ObjectMapper();
        try {
            Template template = objectMapper.readValue(contentBuilder.toString(), Template.class);
            return Optional.of(template);
        } catch (Exception e){
            throw new RuntimeException("ERROR while converting from json to Template object");
        }
    }

    private List<Template> getAll(){
        try (Stream<Path> walk = Files.walk(Paths.get(PathConstant.TEMPLATE))) {
            ObjectMapper objectMapper = new ObjectMapper();
            return walk.filter(Files::isRegularFile)
                    .map(path -> {
                        if(!FilenameUtils.getExtension(path.toString()).equals("json")){
                            return null;
                        }
                        StringBuilder contentBuilder = new StringBuilder();
                        try (Stream<String> stream = Files.lines(Paths.get(path.toString()), StandardCharsets.UTF_8)) {
                            stream.forEach(s -> contentBuilder.append(s).append("\n"));
                            return objectMapper.readValue(contentBuilder.toString(), Template.class);
                        } catch (Exception e) {
                            e.printStackTrace();
                            throw new WrongEncode("UTF8");
                        }
                    }).collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
