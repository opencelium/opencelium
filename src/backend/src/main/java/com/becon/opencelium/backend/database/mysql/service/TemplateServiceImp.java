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

//package com.becon.opencelium.backend.mysql.service;
//
//import com.becon.opencelium.backend.constant.PathConstant;
//import com.becon.opencelium.backend.mysql.entity.Connection;
//import com.becon.opencelium.backend.mysql.entity.Template;
//import com.becon.opencelium.backend.mysql.repository.TemplateRepository;
//import com.becon.opencelium.backend.resource.connection.ConnectionResource;
//import com.becon.opencelium.backend.resource.template.TemplateResource;
//import com.fasterxml.jackson.core.JsonProcessingException;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//
//import java.io.File;
//import java.io.FileReader;
//import java.io.FileWriter;
//import java.io.IOException;
//import java.nio.charset.StandardCharsets;
//import java.nio.file.Files;
//import java.nio.file.Path;
//import java.nio.file.Paths;
//import java.util.List;
//import java.util.Optional;
//import java.util.UUID;
//import java.util.stream.Stream;
//
//@Service
//public class TemplateServiceImp implements TemplateService {
//
//    @Autowired
//    private TemplateRepository templateRepository;
//
//    @Override
//    public void save(Template template) {
//        templateRepository.save(template);
//    }
//
//    @Override
//    public boolean existsByName(String name) {
//        return templateRepository.existsByName(name);
//    }
//
//    @Override
//    public Optional<Template> findById(int id) {
//        return templateRepository.findById(id);
//    }
//
//    @Override
//    public void deleteById(int id) {
//        templateRepository.deleteById(id);
//    }
//
//    @Override
//    public List<Template> findByFromInvokerAndToInvoker(String fromInvoker, String toInvoker) {
//        return templateRepository.findByFromInvokerAndToInvoker(fromInvoker, toInvoker);
//    }
//
//    @Override
//    public Optional<Template> findByIdAndFromInvokerAndToInvoker(int id, String fromInvoker, String toInvoker) {
//        return templateRepository.findByIdAndFromInvokerAndToInvoker(id, fromInvoker, toInvoker);
//    }
//
//    @Override
//    public TemplateResource toResource(Template template) {
//        try {
//            ObjectMapper objectMapper = new ObjectMapper();
//            String json = readJsonFile(template.getConnection());
//            ConnectionResource connectionResource = objectMapper.readValue(json, ConnectionResource.class);
//            TemplateResource templateResource = new TemplateResource();
//            templateResource.setTemplateId(template.getId());
//            templateResource.setName(template.getName());
//            templateResource.setConnection(connectionResource);
//            return templateResource;
//        } catch (IOException e){
//            throw new RuntimeException(e);
//        }
//    }
//
//    @Override
//    public Template toEntity(TemplateResource templateResource) {
//
//        ConnectionResource connectionResource = templateResource.getConnection();
//        String connection = UUID.randomUUID() + ".json";
//        Template template = new Template();
//        template.setName(templateResource.getName());
//        template.setFromInvoker(connectionResource.getFromConnector().getInvoker().getName());
//        template.setToInvoker(connectionResource.getToConnector().getInvoker().getName());
//        template.setConnection(connection);
//        return template;
//    }
//
//    @Override
//    public void saveJsonTemplate(String filename, ConnectionResource connection){
//
//        try {
//            ObjectMapper objectMapper = new ObjectMapper();
//            String json = objectMapper.writeValueAsString(connection);
//            FileWriter file = new FileWriter(PathConstant.TEMPLATE + filename);
//            file.write(json);
//            file.flush();
//        } catch (IOException e) {
//            throw new RuntimeException(e);
//        }
//    }
//
//    @Override
//    public void deleteJsonTemplate(String file) {
//        try {
//            Path json = Paths.get(PathConstant.TEMPLATE + file);
//
//            if(exists(json)){
//                Files.delete(json);
//            }
//        } catch (IOException e){
//            throw new RuntimeException(e);
//        }
//    }
//
//    private String readJsonFile(String fileName){
//
//        StringBuilder contentBuilder = new StringBuilder();
//        try (Stream<String> stream = Files.lines( Paths.get(PathConstant.TEMPLATE + fileName), StandardCharsets.UTF_8))
//        {
//            stream.forEach(s -> contentBuilder.append(s).append("\n"));
//        }
//        catch (IOException e)
//        {
//            e.printStackTrace();
//        }
//
//        return contentBuilder.toString();
//    }
//
//    private boolean exists(Path file) {
//        File tempFile = new File(file.toString());
//        return tempFile.exists();
//    }
//}
