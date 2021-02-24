package com.becon.opencelium.backend.application.service;

import com.becon.opencelium.backend.application.entity.SystemOverview;
import com.becon.opencelium.backend.application.repository.SystemOverviewRepository;
import com.becon.opencelium.backend.resource.application.SystemOverviewResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;

@Service
public class ApplicationServiceImp implements ApplicationService {

    @Autowired
    private SystemOverviewRepository systemOverviewRepository;

    @Override
    public SystemOverview getSystemOverview() {
        return systemOverviewRepository.getCurrentOverview();
    }

    @Override
    public SystemOverviewResource toResource(SystemOverview systemOverview) {
        SystemOverviewResource systemOverviewResource = new SystemOverviewResource();
        systemOverviewResource.setJava(systemOverview.getJava());
        systemOverviewResource.setOc(systemOverview.getOs());
        systemOverviewResource.setElasticSearch(systemOverview.getElasticSearch());
        systemOverviewResource.setKibana(systemOverview.getKibana());
        systemOverviewResource.setMariadb(systemOverview.getMariadb());
        systemOverviewResource.setNeo4j(systemOverview.getNeo4j());
        return systemOverviewResource;
    }
}
