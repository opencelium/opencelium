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

package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.application.entity.SystemOverview;
import com.becon.opencelium.backend.application.entity.AvailableUpdate;
import com.becon.opencelium.backend.application.service.AssistantServiceImp;
import com.becon.opencelium.backend.application.service.UpdatePackageServiceImp;
import com.becon.opencelium.backend.constant.Constant;
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.exception.StorageFileNotFoundException;
import com.becon.opencelium.backend.execution2.executor.Execution;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.mysql.service.ConnectionServiceImp;
import com.becon.opencelium.backend.neo4j.service.ConnectionNodeServiceImp;
import com.becon.opencelium.backend.resource.application.MigrateDataResource;
import com.becon.opencelium.backend.resource.application.SystemOverviewResource;
import com.becon.opencelium.backend.resource.application.AvailableUpdateResource;
import com.becon.opencelium.backend.resource.application.UpdateInvokerResource;
import com.becon.opencelium.backend.resource.connection.ConnectionResource;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.template.TemplateResource;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.template.service.TemplateServiceImp;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.zaxxer.hikari.pool.HikariPool;
import org.springframework.beans.DirectFieldAccessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.sql.DataSource;
import java.io.File;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping(value = "/api/assistant", produces = "application/hal+json", consumes = {"application/json"})
public class UpdateAssistantController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private Environment env;

    @Autowired
    private AssistantServiceImp assistantServiceImp;

    @Autowired
    private UpdatePackageServiceImp packageServiceImp;

    @Autowired
    private TemplateServiceImp templateServiceImp;

    @Autowired
    private InvokerServiceImp invokerServiceImp;

    @Autowired
    private ConnectionServiceImp connectionServiceImp;

    @Autowired
    private ConnectionNodeServiceImp connectionNodeServiceImp;

    @GetMapping("/all")
    public List<String> getAll(){
        DataSource dataSource = (DataSource) jdbcTemplate.getDataSource();
        HikariPool hikariPool = (HikariPool) new DirectFieldAccessor(dataSource).getPropertyValue("pool");
        System.out.println(hikariPool.toString());
        return null;
    }

    @GetMapping("/oc/test")
    public ResponseEntity<?> ocTest(){
        return ResponseEntity.ok().build();
    }

    @GetMapping("/oc/version")
    public ResponseEntity<?> ocCurrentVersion(){
        String version = assistantServiceImp.getVersion();
        String result = "{" + "\"version\": \"" + version + "\"}";
        return ResponseEntity.ok(result);
    }

    @GetMapping("/oc/requirements")
    public ResponseEntity<?> getSystemRequirement() {
        String version = assistantServiceImp.getVersion();
        String result = "{" + "\"version\": \"" + version + "\"}";
        return ResponseEntity.ok(result);
    }

    @GetMapping("/oc/system/overview")
    public ResponseEntity<?> getSystemOverview() {
        SystemOverview systemOverview = assistantServiceImp.getSystemOverview();
        SystemOverviewResource resource = assistantServiceImp.toResource(systemOverview);
        return ResponseEntity.ok(resource);
    }

    @GetMapping("/oc/offline/versions")
    public ResponseEntity<?> getOfflineVersion() {

        List<AvailableUpdate> offVersions  = packageServiceImp.getOffVersions();
        List<AvailableUpdateResource> packageResource = offVersions.stream()
                .map(p -> packageServiceImp.toResource(p)).collect(Collectors.toList());
        return ResponseEntity.ok(packageResource);
    }

    @GetMapping("/oc/online/versions")
    public ResponseEntity<?> getOnlineVersion() {

        List<AvailableUpdate> offVersions  = packageServiceImp.getOnVersions();
        List<AvailableUpdateResource> packageResource = offVersions.stream()
                .map(p -> packageServiceImp.toResource(p)).collect(Collectors.toList());
        return ResponseEntity.ok(packageResource);
    }

    @GetMapping("/oc/repo/status")
    public ResponseEntity<?> checkRepoConnection() {
        if (assistantServiceImp.checkRepoConnection()) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/oc/restart/file/exists")
    public ResponseEntity<?> fileExists() {
        Path currentRelativePath = Paths.get("").toAbsolutePath().getParent().getParent();
        String ocScriptPath = currentRelativePath.toString() + "/scripts/oc_service.sh";
        File file = new File(ocScriptPath);
        ErrorResource errorResource = new ErrorResource();
        errorResource.setMessage("EXISTS");
        errorResource.setStatus(HttpStatus.OK);
        errorResource.setPath(ocScriptPath);
        if (!file.exists()) {
            errorResource.setMessage("NOT_EXISTS");
            errorResource.setStatus(HttpStatus.OK);
            errorResource.setPath(ocScriptPath);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/oc/template")
    public ResponseEntity<?> getAssistentTemplateFiles() {
        String path = PathConstant.TEMPLATE;
        List<Template> templates = templateServiceImp.findAllByPath(path);
        List<TemplateResource> templateResources = templates.stream()
                .map(t -> templateServiceImp.toResource(t))
                .collect(Collectors.toList());
        return ResponseEntity.ok(templateResources);
    }

    // create
    @PostMapping("/oc/migrate")
    public ResponseEntity<?> migrate(@RequestBody MigrateDataResource migrateDataResource) {

        // do backup
//        assistantServiceImp.runScript();
        try {
            String version = migrateDataResource.getVersion();
            assistantServiceImp.createTmpDir(version);

            final String dir;
            if (migrateDataResource.getFolder() != null && !migrateDataResource.getFolder().isEmpty()) {
                dir = migrateDataResource.getFolder();
            } else {
                dir = migrateDataResource.getVersion();
            }

            // saving files to tmp folder
            migrateDataResource.getInvokers().forEach(inv -> {
                assistantServiceImp.saveTmpInvoker(inv, dir + "/invoker");
            });

            migrateDataResource.getTemplates().forEach(temp -> {
                assistantServiceImp.saveTmpTemplate(temp, dir + "/template");
            });

            migrateDataResource.getConnections().forEach(ction -> {
                assistantServiceImp.saveTmpConnection(ction, dir + "/connection");
            });

            if (migrateDataResource.isOnline()) {
                assistantServiceImp.updateOn(version);
            } else {
                assistantServiceImp.updateOff(dir, version);
            }

            // after update need to move or replace files in main project
            Path filePath = Paths.get(PathConstant.ASSISTANT + "temporary/" + dir + "/invoker");
            List<File> invokers = Files.list(filePath)
                    .filter(Files::isRegularFile)
                    .filter(path -> path.toString().endsWith(".xml"))
                    .map(Path::toFile)
                    .collect(Collectors.toList());
            invokers.forEach(f -> {
                assistantServiceImp.moveFiles(f.getPath(), PathConstant.INVOKER + f.getName());
            });

            filePath = Paths.get(PathConstant.ASSISTANT + "temporary/" + dir + "/template");
            List<File> templates = Files.list(filePath)
                    .filter(Files::isRegularFile)
                    .filter(path -> path.toString().endsWith(".json"))
                    .map(Path::toFile)
                    .collect(Collectors.toList());
            templates.forEach(f -> {
                assistantServiceImp.moveFiles(f.getPath(), PathConstant.TEMPLATE + f.getName());
            });

            Object connectionResources = migrateDataResource.getConnections().stream()
                    .map(t -> JsonPath.read(t, "$.connection")).collect(Collectors.toList());
            List<HashMap> cns = (ArrayList) connectionResources;
            ObjectMapper objectMapper = new ObjectMapper();
            for (HashMap<String, Object> connection : cns) {
                String str = objectMapper.writeValueAsString(connection);
                ConnectionResource connectionResource = objectMapper.readValue(str, ConnectionResource.class);
                assistantServiceImp.updateConnection(connectionResource);
            }

            assistantServiceImp.buildAndRestart();

        } catch (Exception e) {
            throw new RuntimeException(e);
//            assistantServiceImp.restore();
        }

        return ResponseEntity.ok().build();
    }

    @ResponseBody
    @GetMapping("/changelog/file/{packageName}")
    public ResponseEntity<org.springframework.core.io.Resource> download(@PathVariable String packageName) {

        try {
            String path = PathConstant.APPLICATION + packageName + "/";
            Path rootLocation = Paths.get(path);
            Path filePath = rootLocation.resolve("CHANGELOG");
            org.springframework.core.io.Resource file = new UrlResource(filePath.toUri());
            if (!file.exists() || !file.isReadable()) {
                throw new StorageFileNotFoundException("Could not read file: " + packageName + "/CHANGELOG");
            }
            return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + file.getFilename() + "\"").body(file);
        }
        catch (MalformedURLException e) {
            throw new StorageFileNotFoundException("Could not read file: " + packageName + "/CHANGELOG", e);
        }
    }
}
