package com.becon.opencelium.backend.application.service;

        import com.becon.opencelium.backend.application.entity.SystemOverview;
        import com.becon.opencelium.backend.resource.application.SystemOverviewResource;
        import com.becon.opencelium.backend.resource.connection.ConnectionResource;
        import org.springframework.stereotype.Service;
        import org.springframework.web.multipart.MultipartFile;

        import java.nio.file.Path;
        import java.util.List;

public interface ApplicationService {

    SystemOverview getSystemOverview();
    Path uploadZipFile(MultipartFile file, String location);
    void deleteZipFile(Path path);
    void createTmpDir(String dir);
    SystemOverviewResource toResource(SystemOverview systemOverview);
    void updateOn() throws Exception;
    void updateOff(String dir) throws Exception;
    void updateConnection(ConnectionResource connectionresource);
    boolean checkRepoConnection();
    void restore();
}
