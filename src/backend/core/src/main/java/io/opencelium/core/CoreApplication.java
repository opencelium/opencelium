package io.opencelium.core;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.data.mongodb.autoconfigure.DataMongoAutoConfiguration;
import org.springframework.boot.mongodb.autoconfigure.MongoAutoConfiguration;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

import io.opencelium.core.setup.SetupLauncher;

// Mongo client, database factory and template come from io.opencelium.core.config.mongo.MongoConfig instead.
// No Spring Security user with a generated password: it would print that password at each start, and only
// OpenCelium users log in.
@SpringBootApplication(scanBasePackages = {"io.opencelium.core", "io.opencelium.execution"},
		exclude = {MongoAutoConfiguration.class, DataMongoAutoConfiguration.class,
				UserDetailsServiceAutoConfiguration.class})
@EnableScheduling
public class CoreApplication {

	/** Decides first whether the setup wizard runs; the launcher starts Spring Boot with the arguments meant for it. */
	public static void main(String[] args) {
		SetupLauncher.forThisHost()
				.launch(args, springArgs -> SpringApplication.run(CoreApplication.class, springArgs))
				.ifPresent(System::exit);
	}

}
