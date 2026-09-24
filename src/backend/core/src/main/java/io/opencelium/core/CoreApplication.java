package io.opencelium.core;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.data.mongodb.autoconfigure.DataMongoAutoConfiguration;
import org.springframework.boot.mongodb.autoconfigure.MongoAutoConfiguration;

// Mongo client, database factory and template come from io.opencelium.core.config.mongo.MongoConfig instead.
@SpringBootApplication(scanBasePackages = {"io.opencelium.core", "io.opencelium.execution"},
		exclude = {MongoAutoConfiguration.class, DataMongoAutoConfiguration.class})
public class CoreApplication {

	public static void main(String[] args) {
		SpringApplication.run(CoreApplication.class, args);
	}

}
