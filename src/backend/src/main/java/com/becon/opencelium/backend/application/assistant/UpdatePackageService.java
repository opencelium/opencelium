package com.becon.opencelium.backend.application.assistant;

import com.becon.opencelium.backend.application.entity.AvailableUpdate;
import com.becon.opencelium.backend.resource.application.AvailableUpdateResource;

import java.util.List;

public interface UpdatePackageService {

    List<AvailableUpdate> getOffVersions();
    List<AvailableUpdate> getOnVersions();
    AvailableUpdate getAvailableUpdate(String version) throws Exception;
    String[] getDirectories();
    void downloadPackage(String version) throws Exception;
    AvailableUpdateResource toResource(AvailableUpdate offVersions);
}
