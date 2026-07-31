package com.becon.opencelium.backend.application.assistant;

import com.becon.opencelium.backend.application.entity.SystemOverview;
import com.becon.opencelium.backend.resource.application.SystemOverviewResource;
import com.becon.opencelium.backend.resource.updateassistant.InstallationDTO;
import com.becon.opencelium.backend.resource.updateassistant.JarFileDescriptor;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

public interface ApplicationService {

    SystemOverview getSystemOverview();
    Path uploadZipFile(MultipartFile file, Path location);
    void deleteZipFile(Path path);
    SystemOverviewResource toResource(SystemOverview systemOverview);
    void updateOff(String dir) throws Exception;
    String getCurrentVersion();
    InstallationDTO getInstallation();
    List<JarFileDescriptor> getOldJarFiles();
    List<JarFileDescriptor> deleteOldJarFiles();
}
