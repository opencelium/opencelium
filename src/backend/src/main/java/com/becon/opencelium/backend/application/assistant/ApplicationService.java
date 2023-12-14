package com.becon.opencelium.backend.application.assistant;

import com.becon.opencelium.backend.application.entity.SystemOverview;
import com.becon.opencelium.backend.resource.application.SystemOverviewResource;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;

public interface ApplicationService {

    SystemOverview getSystemOverview();
    Path uploadZipFile(MultipartFile file, Path location);
    void deleteZipFile(Path path);
    void createTmpDir(String dir);
    SystemOverviewResource toResource(SystemOverview systemOverview);
    void updateOn(String version) throws Exception;
    void updateOff(String dir) throws Exception;
    void updateConnection(ConnectionDTO connectionresource);
    boolean checkRepoConnection();
    void buildAndRestart();
    String getCurrentVersion();
    void restore();
}
