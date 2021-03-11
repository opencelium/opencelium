package com.becon.opencelium.backend.application.service;

import com.becon.opencelium.backend.application.entity.UpdatePackage;
import com.becon.opencelium.backend.resource.application.UpdatePackageResource;

import java.util.List;

public interface UpdatePackageService {

    List<UpdatePackage> getOffVersions();
    List<UpdatePackage> getOnVersions();

    UpdatePackageResource toResource(UpdatePackage offVersions);
}
