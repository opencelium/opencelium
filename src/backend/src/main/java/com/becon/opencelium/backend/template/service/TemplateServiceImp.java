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

import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.exception.WrongEncode;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.old.ConnectionOldDTO;
import com.becon.opencelium.backend.resource.template.CtionTemplateResource;
import com.becon.opencelium.backend.resource.template.TemplateResource;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.utility.FileNameUtils;
import com.becon.opencelium.backend.versionmanager.EntityUpdater;
import com.becon.opencelium.backend.versionmanager.EntityVersionManager;
import com.becon.opencelium.backend.versionmanager.backup.FileBackupManager;
import com.becon.opencelium.backend.versionmanager.base.Utils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class TemplateServiceImp implements TemplateService {
    private static final Logger log = LoggerFactory.getLogger(TemplateServiceImp.class);
    private final ConnectionService connectionService;
    private final Mapper<ConnectionOldDTO, CtionTemplateResource> mapper;
    private final Mapper<ConnectionDTO, ConnectionOldDTO> oldDTOMapper;
    private final OpenceliumProps ocProps;
    private final EntityUpdater<Template> templateEntityUpdater;
    private final ObjectMapper objectMapper;

    public TemplateServiceImp(
            @Qualifier("connectionServiceImp") ConnectionService connectionService,
            Mapper<ConnectionOldDTO, CtionTemplateResource> mapper,
            Mapper<ConnectionDTO, ConnectionOldDTO> oldDTOMapper,
            EntityVersionManager entityVersionManager,
            OpenceliumProps ocProps,
            @Qualifier("objectMapper") ObjectMapper objectMapper) {
        this.connectionService = connectionService;
        this.mapper = mapper;
        this.oldDTOMapper = oldDTOMapper;
        this.ocProps = ocProps;
        this.templateEntityUpdater = entityVersionManager.getUpdater(Template.class);
        this.objectMapper = objectMapper;
    }

    @Override
    public TemplateResource toResource(Template template) {
        TemplateResource templateResource = new TemplateResource();
        templateResource.setName(template.getName());
        templateResource.setTemplateId(template.getTemplateId());
        templateResource.setDescription(template.getDescription());
        templateResource.setVersion(template.getVersion());
        templateResource.setConnection(template.getConnection());
        templateResource.setLink(PathConstant.TEMPLATE_URL + template.getTemplateId());
        return templateResource;
    }

    @Override
    public Template toEntity(TemplateResource templateResource) {
        Template template = new Template();
        template.setTemplateId(templateResource.getTemplateId());
        template.setName(templateResource.getName());
        template.setTemplateId(templateResource.getTemplateId());
        template.setDescription(templateResource.getDescription());
        template.setConnection(templateResource.getConnection());
        template.setVersion(templateResource.getVersion());
        return template;
    }

    @Override
    public void save(Template template) {
        save(template, template.getTemplateId() + ".json");
    }

    @Override
    public List<Template> findByFromInvokerAndToInvoker(String fromInvoker, String toInvoker) {
        List<Template> result = new ArrayList<>();
        getAll(PathConstant.TEMPLATE).forEach(t -> {
            if (t == null) {
                return;
            }
            String invNameFrom = t.getConnection().getFromConnector().getInvoker().getName().toUpperCase();
            String invNameTo = t.getConnection().getToConnector().getInvoker().getName().toUpperCase();
            if (invNameFrom.equals(fromInvoker.toUpperCase()) && invNameTo.equals(toInvoker.toUpperCase())) {
                result.add(t);
            }
        });
        return result;
    }

    @Override
    public List<Template> findAll() {
        return getAll(PathConstant.TEMPLATE);
    }

    @Override
    public List<Template> findAllByPath(String path) {
        return getAll(path);
    }

    @Override
    public boolean existsById(String templateId) {
        List<Template> templates = getAll(PathConstant.TEMPLATE);
        return templateId == null || templates.stream().anyMatch(t -> t.getTemplateId().equals(templateId));
    }

    @Override
    public TemplateResource getByConnectionId(Long connectionId) {
        ConnectionDTO connectionDTO = connectionService.getFullConnection(connectionId);
        ConnectionOldDTO oldDTO = oldDTOMapper.toDTO(connectionDTO);
        CtionTemplateResource connectionRes = mapper.toDTO(oldDTO);

        TemplateResource templateResource = new TemplateResource();
        templateResource.setConnection(connectionRes);
        templateResource.setName(connectionRes.getTitle());
        templateResource.setDescription(connectionRes.getDescription());
        templateResource.setTemplateId(UUID.randomUUID().toString());
        templateResource.setVersion(ocProps.getVersion());
        return templateResource;
    }

    @Override
    public void updateTemplatesToCurrentVersion() {
        // move from /src/main/resources/templates to /runtime/templates
        moveTemplatesToNewLocation();

        Map<String, Template> templateMap = getAllAsMap();
        for (Map.Entry<String, Template> entry : templateMap.entrySet()) {
            String fileName = entry.getKey();
            Template template = entry.getValue();
            Template backup;
            try {
                backup = objectMapper.readValue(objectMapper.writeValueAsString(template), Template.class);
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }

            if (Utils.compare(ocProps.getVersion(), template.getVersion()) > 0) {
                try {
                    String oldVersion = template.getVersion();
                    templateEntityUpdater.updateToCurrentVersion(template)
                            .ifUpdated(x -> {
                                template.setVersion(ocProps.getVersion());
                                FileBackupManager.doBackup(backup, oldVersion, ocProps.getVersion());
                                save(template, fileName);
                                log.info("Template[id={}, name={}] is successfully updated to {} version", template.getTemplateId(), template.getName(), ocProps.getVersion());
                            });
                } catch (Exception e) {
                    log.error("Failed to update Template[id={}, name={}]", template.getTemplateId(), template.getName(), e);
                }
            }
        }
    }

    private void moveTemplatesToNewLocation() {
        List<Path> templatesInResources = getAllPaths(PathConstant.TEMPLATE_ON_RESOURCES);

        templatesInResources.forEach(x -> {
            try {
                Files.move(
                        x,
                        Paths.get(PathConstant.TEMPLATE).resolve(x.getFileName()),
                        StandardCopyOption.REPLACE_EXISTING
                );
            } catch (IOException e) {
                log.error("Failed to move {} file from {} to {}", x, PathConstant.TEMPLATE_ON_RESOURCES, PathConstant.TEMPLATE);
                throw new RuntimeException(e);
            }
        });

        try {
            Files.deleteIfExists(Path.of(PathConstant.TEMPLATE_ON_RESOURCES));
        } catch (IOException e) {
            log.error("Failed to remove folder {}", PathConstant.TEMPLATE_ON_RESOURCES);
            throw new RuntimeException(e);
        }
    }

    @Override
    public void deleteById(String templateId) {
        Map<String, Template> templates = getAllAsMap();
        String fileName = templates.entrySet().stream().filter(entry -> entry.getValue().getTemplateId().equals(templateId))
                .findFirst().map(entry -> entry.getKey()).orElse(null);
//        String path = PathConstant.TEMPLATE + templateId.concat(".json");
        if (fileName == null) {
            throw new RuntimeException("FILE_NOT_FOUND");
        }
        File file = Paths.get(PathConstant.TEMPLATE).resolve(fileName).toFile();
        if (!file.delete()) {
            throw new RuntimeException("FILE_NOT_DELETED");
        }
    }

    @Override
    public Optional<Template> findById(String id) {
        StringBuilder contentBuilder = new StringBuilder();
        try (Stream<String> stream = Files
                .lines(Paths.get(PathConstant.TEMPLATE).resolve(id.concat(".json")), StandardCharsets.UTF_8)) {

            stream.forEach(s -> contentBuilder.append(s).append("\n"));
        } catch (IOException e) {
            e.printStackTrace();
        }

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        try {
            Template template = objectMapper.readValue(contentBuilder.toString(), Template.class);
            return Optional.of(template);
        } catch (Exception e) {
            throw new RuntimeException("ERROR while converting from json to Template object");
        }
    }


    private void save(Template template, String fileName) {
        try {
            String id = template.getTemplateId();
            ObjectMapper objectMapper = new ObjectMapper();
            template.setTemplateId(id);

            Path filePath = Paths.get(PathConstant.TEMPLATE).resolve(fileName);
            try (BufferedWriter writer = Files.newBufferedWriter(filePath, StandardCharsets.UTF_8)) {
                objectMapper.writeValue(writer, template);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private List<Template> getAll(String folder) throws WrongEncode {
        try (Stream<Path> walk = Files.walk(Paths.get(folder))) {
            ObjectMapper objectMapper = new ObjectMapper();
            return walk.filter(Files::isRegularFile)
                    .filter(path -> FileNameUtils.getExtension(path.toString()).equals("json"))
                    .map(path -> {
//                        if(!FilenameUtils.getExtension(path.toString()).equals("json")){
//                            return null;
//                        }
                        StringBuilder contentBuilder = new StringBuilder();
                        try (Stream<String> stream = Files.lines(Paths.get(path.toString()), StandardCharsets.UTF_8)) {
                            stream.forEach(s -> contentBuilder.append(s).append("\n"));
//                            System.out.println(Paths.get(path.toString()).getFileName().toString());
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

    private Map<String, Template> getAllAsMap() throws WrongEncode {
        try (Stream<Path> walk = Files.walk(Paths.get(PathConstant.TEMPLATE))) {
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Template> files = new HashMap<>();
            walk.filter(Files::isRegularFile).forEach(path -> {
                if (!FileNameUtils.getExtension(path.toString()).equals("json")) {
                    return;
                }
                StringBuilder contentBuilder = new StringBuilder();
                Path filePath = Paths.get(path.toString());
                try (Stream<String> stream = Files.lines(filePath, StandardCharsets.UTF_8)) {
                    stream.forEach(s -> contentBuilder.append(s).append("\n"));
                    Template template = objectMapper.readValue(contentBuilder.toString(), Template.class);
                    files.put(filePath.getFileName().toString(), template);
                } catch (Exception e) {
                    e.printStackTrace();
                    throw new WrongEncode("UTF8");
                }
            });

            return files;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private List<Path> getAllPaths(String folder) {
        if (Files.notExists(Paths.get(folder))) {
            return Collections.emptyList();
        }

        try (Stream<Path> walk = Files.walk(Paths.get(folder))) {
            return walk.filter(Files::isRegularFile)
                    .filter(path -> FileNameUtils.getExtension(path.toString()).equals("json"))
                    .map(Path::toAbsolutePath)
                    .toList();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
