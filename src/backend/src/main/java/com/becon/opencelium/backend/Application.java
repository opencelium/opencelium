/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend;

import com.becon.opencelium.backend.utility.migrate.YAMLMigrator;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.nio.file.Paths;
import java.util.Properties;

@SpringBootApplication(scanBasePackages = "com.becon.opencelium.backend")
@EnableScheduling
@EnableAsync
@EnableConfigurationProperties
public class Application {

	public static void main(String[] args) {
		SpringApplication application = new SpringApplication(Application.class);
		prepare(application);
		application.run(args);
	}

	private static void prepare(SpringApplication application) {
		YAMLMigrator.run();

		String configLocation = Paths.get(System.getProperty("user.dir")).resolve("src/main/resources/application.yml").toString();
		Properties properties = new Properties();
		properties.put("spring.config.location", configLocation);
		application.setDefaultProperties(properties);
	}
}
