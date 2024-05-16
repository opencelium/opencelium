package com.becon.opencelium.backend.application.assistant;

import com.becon.opencelium.backend.application.entity.AvailableUpdate;
import com.becon.opencelium.backend.resource.application.AvailableUpdateResource;
import com.becon.opencelium.backend.resource.update_assistant.PackageVersionResource;
import com.becon.opencelium.backend.utility.PackageVersionManager;

import java.nio.file.Path;
import java.util.List;

public interface UpdatePackageService {

    List<AvailableUpdate> getOffVersions();
    List<PackageVersionResource> getOnVersions();
    AvailableUpdate getAvailableUpdate(String version) throws Exception;
    String[] getDirectories();
    AvailableUpdateResource toResource(AvailableUpdate offVersions);
}
