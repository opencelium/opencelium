package com.becon.opencelium.backend.application.service;

import com.becon.opencelium.backend.application.entity.SystemOverview;
import com.becon.opencelium.backend.resource.application.SystemOverviewResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

public interface ApplicationService {

    SystemOverview getSystemOverview();
    void uploadZipFile(MultipartFile file, String location);
    SystemOverviewResource toResource(SystemOverview systemOverview);
}
