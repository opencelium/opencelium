package com.becon.opencelium.backend.application.health;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.Objects;

@Component
public class OpenceliumHealthIndicator extends AbstractHealthIndicator {

    @Autowired
    private Environment env;

    @Override
    protected void doHealthCheck(Health.Builder builder) throws Exception {
        String version = getVersion();
        builder.up()
                .withDetail("version", Objects.requireNonNull(version));
    }

    private String getVersion() {
        try	{
            FileRepositoryBuilder builder = new FileRepositoryBuilder();
            Repository repository = builder
                    .readEnvironment()
                    .findGitDir()
                    .build();
            Git git = new Git(repository);
            return git.describe().call();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "";
    }
}
