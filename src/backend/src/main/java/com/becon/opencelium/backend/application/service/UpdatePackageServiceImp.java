package com.becon.opencelium.backend.application.service;

import com.becon.opencelium.backend.application.entity.UpdatePackage;
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.resource.application.UpdatePackageResource;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.jayway.jsonpath.JsonPath;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.File;
import java.io.FilenameFilter;
import java.net.URI;
import java.nio.file.Paths;
import java.util.*;

@Service
public class UpdatePackageServiceImp implements UpdatePackageService {

    @Autowired
    private ObjectMapper jsonOm;

    @Autowired
    private Environment env;

    @Override
    public List<UpdatePackage> getOffVersions() {

        File file = new File(PathConstant.APPLICATION_VERSION);
        String[] directories = file.list(new FilenameFilter() {
            @Override
            public boolean accept(File current, String name) {
                return new File(current, name).isDirectory();
            }
        });

        if (directories == null) {
            return null;
        }
        List<UpdatePackage> versions;
        try {
            versions = getAll(directories);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return versions;
    }

    @Override
    public List<UpdatePackage> getOnVersions() {
        return null;
    }

    @Override
    public UpdatePackageResource toResource(UpdatePackage offVersions) {
        UpdatePackageResource updatePackageResource = new UpdatePackageResource();
        updatePackageResource.setName(offVersions.getName());
        updatePackageResource.setStatus(offVersions.getStatus());
        updatePackageResource.setVersion(offVersions.getVersion());
        updatePackageResource.setChangelogLink(offVersions.getChangelogLink());
        return updatePackageResource;
    }

    private List<UpdatePackage> getAll(String[] appDirectories) throws Exception {
        ObjectMapper ymlOm = new ObjectMapper(new YAMLFactory());
        List<UpdatePackage> packages = new LinkedList<>();
        for (String appDir : appDirectories) {
            UpdatePackage updatePackage = new UpdatePackage();

            String yamlPath = PathConstant.APPLICATION_VERSION + appDir + PathConstant.RESOURCES + "application_default.yml";
            File application_yml = Paths.get(yamlPath).toFile();

            Object obj = ymlOm.readValue(application_yml, Map.class);
            String s = jsonOm.writeValueAsString(obj);

            String paths = "$.opencelium.version";
            Object version;
            if (JsonPath.isPathDefinite(yamlPath)) {
                version = JsonPath.read(s, paths);
            } else {
                version = "opencelium.version not found in application_default.yml file";
            }
            if (!(version instanceof String)) {
                version = "opencelium.version should be String and look like: v.#.#.#";
            }

            String status = getVersionStatus(version.toString());
            String c = PathConstant.APPLICATION_VERSION + appDir + PathConstant.RESOURCES + "changelog.txt";
            updatePackage.setName(appDir);
            updatePackage.setStatus(status);
            updatePackage.setChangelogLink(getChangelogLink(appDir));
            updatePackage.setVersion(version.toString());
            packages.add(updatePackage);
        }
        return packages;
    }

    private String getChangelogLink(String ocPackage) {
        final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        return uri.getScheme() + "://" + uri.getAuthority() + "/api/application/changelog/file/" + ocPackage;
    }

    // [1.2, 1.3] :  1.2 - current
    // [1.2, 1.3] :  1.3 - current
    private String getVersionStatus(String version) {
        String currentVersion = env.getProperty("opencelium.version");
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
        } else if(isParent && !isOld){
            return "available";
        } else {
            return "not_available";
        }
    }
}
