package com.becon.opencelium.backend.application.assistant;

import com.becon.opencelium.backend.application.entity.AvailableUpdate;
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.resource.application.AvailableUpdateResource;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.File;
import java.io.FilenameFilter;
import java.io.InputStream;
import java.net.URI;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UpdatePackageServiceImp implements UpdatePackageService {

    @Autowired
    private ObjectMapper jsonOm;

    @Autowired
    private Environment env;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private AssistantServiceImp assistantServiceImp;

    @Override
    public List<AvailableUpdate> getOffVersions() {


        String[] directories = getDirectories();

        if (directories == null) {
            return null;
        }
        List<AvailableUpdate> versions;
        try {
            versions = getAll(directories);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return versions;
    }

    @Override
    public List<AvailableUpdate> getOnVersions() {
        try {
            List<String> versions = getVersions();
            List<AvailableUpdate> availableUpdates = versions.stream().map(v -> {
                AvailableUpdate availableUpdate = new AvailableUpdate();
                String status = getVersionStatus(v);
                availableUpdate.setStatus(status);
                availableUpdate.setVersion(v);
                return availableUpdate;
            }).collect(Collectors.toList());
            return availableUpdates;
        } catch (Exception e) {
            throw  new RuntimeException(e);
        }
    }

    // assistant/versions/{folder}
    @Override
    public AvailableUpdate getOffVersionByDir(String appDir) throws Exception {
        String version = assistantServiceImp.getVersionFromDir(appDir);
        String status = getVersionStatus(version);
        AvailableUpdate availableUpdate = new AvailableUpdate();
        availableUpdate.setFolder(appDir);
        availableUpdate.setStatus(status);
        availableUpdate.setChangelogLink(getChangelogLink(appDir));
        availableUpdate.setVersion(version);
        return availableUpdate;
    }

    @Override
    public String[] getDirectories() {
        File file = new File(PathConstant.ASSISTANT + PathConstant.VERSIONS);
        return file.list(new FilenameFilter() {
            @Override
            public boolean accept(File current, String name) {
                return new File(current, name).isDirectory();
            }
        });
    }

    @Override
    public AvailableUpdateResource toResource(AvailableUpdate offVersions) {
        AvailableUpdateResource availableUpdateResource = new AvailableUpdateResource();
        availableUpdateResource.setFolder(offVersions.getFolder());
        availableUpdateResource.setStatus(offVersions.getStatus());
        availableUpdateResource.setName(offVersions.getVersion());
        availableUpdateResource.setChangelogLink(offVersions.getChangelogLink());
        return availableUpdateResource;
    }

    private List<AvailableUpdate> getAll(String[] appDirectories) throws Exception {
        List<AvailableUpdate> packages = new LinkedList<>();
        for (String appDir : appDirectories) {
            AvailableUpdate availableUpdate = getOffVersionByDir(appDir);
            packages.add(availableUpdate);
        }
        return packages;
    }

    private String getChangelogLink(String ocPackage) {
        final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        return uri.getScheme() + "://" + uri.getAuthority() + "/api/assistant/changelog/file/" + ocPackage;
    }

    // [1.2, 1.3] :  1.2 - current
    // [1.2, 1.3] :  1.3 - current
    private String getVersionStatus(String version) {
        String currentVersion = assistantServiceImp.getCurrentVersion();
        ArrayList<String> versions = new ArrayList<>();
        versions.add(currentVersion);
        versions.add(version);
        Collections.sort(versions);
        boolean isCurrent = versions.get(1).equalsIgnoreCase(versions.get(0));
        boolean isOld = versions.get(0).equals(version);
        boolean isParent = version.contains(currentVersion);
        if (isCurrent) {
            return "current";
        } else if(isOld) {
            return "old";
        } else if(isParent){
            return "available";
        } else {
            return "available";
        }
    }

    private List<String> getVersions() throws Exception{
        String url = "https://api.bitbucket.org/2.0/repositories/becon_gmbh/opencelium/refs/tags";
        HttpMethod method = HttpMethod.GET;
        HttpHeaders header = new HttpHeaders();
        header.set("Content-Type", "application/json");
        HttpEntity<Object> httpEntity = new HttpEntity <Object> (header);
        ResponseEntity<String> response = restTemplate.exchange(url, method ,httpEntity, String.class);
        String values = JsonPath.read(response.getBody(), "$.values[*].name").toString();
        return new ObjectMapper().readValue(values, List.class);
    }
}
