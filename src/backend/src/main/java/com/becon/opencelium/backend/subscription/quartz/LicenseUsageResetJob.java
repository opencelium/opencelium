package com.becon.opencelium.backend.subscription.quartz;

import liquibase.license.LicenseService;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;

public class LicenseUsageResetJob implements Job {
    @Autowired
    private LicenseService licenseService;


    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        
    }
}
