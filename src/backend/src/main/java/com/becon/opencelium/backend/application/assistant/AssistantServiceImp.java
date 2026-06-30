package com.becon.opencelium.backend.application.assistant;

import com.becon.opencelium.backend.application.entity.SystemOverview;
import com.becon.opencelium.backend.application.repository.SystemOverviewRepository;
import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.constant.ExceptionMessages;
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.resource.application.SystemOverviewResource;
import com.becon.opencelium.backend.resource.updateassistant.InstallationDTO;
import com.becon.opencelium.backend.resource.updateassistant.JarFileDescriptor;
import com.becon.opencelium.backend.utility.PackageVersionManager;
import com.becon.opencelium.backend.utility.ZipUtils;
import com.becon.opencelium.backend.versionmanager.base.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
public class AssistantServiceImp implements ApplicationService {

    private static final Logger log = LoggerFactory.getLogger(AssistantServiceImp.class);
    @Autowired
    private SystemOverviewRepository systemOverviewRepository;

    @Autowired
    private Environment env;

    @Autowired
    private OpenceliumProps ocProps;

    @Override
    public SystemOverview getSystemOverview() {
        return systemOverviewRepository.getCurrentOverview();
    }

    // if directory is not exists function will create;
    @Override
    public Path uploadZipFile(MultipartFile file, Path location) {
        String filename = file.getOriginalFilename();
        Path target = location.resolve(filename);
        try {
            if (file.isEmpty()) {
                throw new StorageException("Failed to store empty file " + filename);
            }
            if (filename.contains("..")) {
                // This is a security check
                throw new StorageException(
                        "Cannot store file with relative path outside current directory "
                                + filename);
            }
            if (!Files.exists(location)) {
                Files.createDirectory(location);
            }
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target,
                        StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            e.printStackTrace();
            throw new StorageException("Failed to store file " + filename, e);
        }

        return target;
    }


    @Override
    public void deleteZipFile(Path path) {
        if (path.equals("")) {
            return;
        }
        try {
            File tempFile = new File(path.toString());
            if (!tempFile.exists()) {
                return;
            }
            Files.walk(path)
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
        } catch (IOException e) {
            throw new StorageException("Failed to delete stored file", e);
        }
    }

    @Override
    public SystemOverviewResource toResource(SystemOverview systemOverview) {
        SystemOverviewResource systemOverviewResource = new SystemOverviewResource();
        systemOverviewResource.setJava(systemOverview.getJava());
        systemOverviewResource.setOs(systemOverview.getOs());
        systemOverviewResource.setMariadb(systemOverview.getMariadb());
        systemOverviewResource.setMongodb(systemOverview.getMongodb());
        return systemOverviewResource;
    }

    // TODO: test
    @Override
    public String getCurrentVersion() {
        return systemOverviewRepository.getCurrentVersion();
    }

    @Override
    public InstallationDTO getInstallation() {
        String installType;
        if (!env.containsProperty(AppYamlPath.INSTALLATION) &&
                !env.containsProperty(AppYamlPath.INSTALLATION + ".type")) {

            installType = "undefined";
            log.warn("Path " + AppYamlPath.INSTALLATION + ".type not found in application.yml");
        } else {
            installType = env.getProperty(AppYamlPath.INSTALLATION + ".type");
        }
        return new InstallationDTO(installType);
    }


    public String getVersion(InputStream inputStream) {
        return systemOverviewRepository.getVersionFromStream(inputStream);
    }

    @Override
    public void updateOff(String dir) throws Exception { // removed version parameter
        dir = PathConstant.ASSISTANT + PathConstant.VERSIONS + dir;
        File backendRoot = new File("");
        File file = new File(dir);
        File[] dirFiles = file.listFiles();
        File zipFile;
        if (dirFiles != null && dirFiles.length != 0) {
            zipFile = dirFiles[0];
        } else {
            throw new RuntimeException("Zip file in folder \"versions/" + dir + "\" not found.");
        }
        InputStream inputStream = Files.newInputStream(zipFile.toPath());
        Path appRoot = Paths.get(backendRoot.getAbsolutePath()).getParent().getParent();
        log.info(zipFile.toPath() + ", " + appRoot);
        ZipUtils.extractZip(inputStream, appRoot);
    }

    @Override
    public List<JarFileDescriptor> getOldJarFiles() {
        Path libsPath = Paths.get(PathConstant.LIBS);

        try (Stream<Path> fileStream = Files.walk(libsPath)) {
            return fileStream.filter(Files::isRegularFile)
                    .filter(file -> file.getFileName().toString().startsWith(PathConstant.JAR_PREFIX) && file.getFileName().toString().endsWith(".jar"))
                    .filter(file -> {
                        String fileVersion = PackageVersionManager.extractVersionOfJarFile(file.getFileName().toString());
                        return Utils.compare(fileVersion, ocProps.getVersion()) < 0;
                    })
                    .map(file -> new JarFileDescriptor(libsPath.toAbsolutePath().toString(), file.getFileName().toString()))
                    .toList();
        } catch (IOException e) {
            log.error(e.getMessage());
            throw new GeneralServiceException(ExceptionConstant.INTERNAL_ERROR, ExceptionMessages.UNKNOWN_ERROR);
        }
    }

    @Override
    public List<JarFileDescriptor> deleteOldJarFiles() {
        List<JarFileDescriptor> oldJarFiles = getOldJarFiles();
        if (oldJarFiles == null) {
            return Collections.emptyList();
        }

        oldJarFiles.forEach(oldJarFile -> {
            try {
                Files.deleteIfExists(Paths.get(PathConstant.LIBS).resolve(oldJarFile.getFileName()));
            } catch (IOException e) {
                log.error(e.getMessage());
                throw new GeneralServiceException(ExceptionConstant.INTERNAL_ERROR, ExceptionMessages.UNKNOWN_ERROR);
            }
        });

        return oldJarFiles;
    }
}
