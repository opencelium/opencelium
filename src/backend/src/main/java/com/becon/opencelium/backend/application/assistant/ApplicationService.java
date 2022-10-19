package com.becon.opencelium.backend.application.assistant;

import com.becon.opencelium.backend.application.entity.SystemOverview;
import com.becon.opencelium.backend.resource.application.SystemOverviewResource;
import com.becon.opencelium.backend.resource.connection.ConnectionResource;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;

public interface ApplicationService {

    SystemOverview getSystemOverview();
    Path uploadZipFile(MultipartFile file, String location);
    void deleteZipFile(Path path);
    void createTmpDir(String dir);
    SystemOverviewResource toResource(SystemOverview systemOverview);
    void updateOn(String version) throws Exception;
    void updateOff(String dir, String version) throws Exception;
    void updateConnection(ConnectionResource connectionresource);
    boolean checkRepoConnection();
    void buildAndRestart();
    String getCurrentVersion();
    void restore();
}
