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

package com.becon.opencelium.backend.constant;

import java.nio.file.Path;
import java.nio.file.Paths;

public interface PathConstant {
    String MONGODB = "com.becon.opencelium.backend.database.mongodb";
    String MYSQl = "com.becon.opencelium.backend.database.mysql";
    String ELASTICSEARCH = "com.becon.opencelium.backend.elasticsearch";

    String RUNTIME = "runtime/";
    String RESOURCES = "src/main/resources";
    String INVOKER = RUNTIME + "invoker/";
    String INVOKER_ON_RESOURCES = RESOURCES + "/invoker/";
    String LICENSE = RESOURCES + "/license/";
    String TEMPLATE = RUNTIME + "templates/";
    String TEMPLATE_ON_RESOURCES = RESOURCES + "/templates";
    String ICONS = "src/main/resources/icon/";
    String APP_DEFAULT_YML = "src/main/resources/application_default.yml";
    String APP_YML = "src/main/resources/application.yml";
    String INSTRUCTION = "src/backend/assistant/instruction/update_instruction.html";
    String IMAGES = "./storage/files/";
    String TEMPLATE_URL = "./template/";
    String VERSIONS = "versions/";
    String ASSISTANT = "assistant/";
    String LIBS = "build/libs/";
    String CHANGELOG = "./assistant/changelog/file/";
    String BACKUP = RUNTIME + "backup/";

    String JAR_PREFIX = "opencelium.backend-";

    /** System property that overrides the location of {@code application.yml}. */
    String APP_YML_PROPERTY = "opencelium.config.file-path";

    /** Environment variable that overrides the location of {@code application.yml}. */
    String APP_YML_ENV = "OPENCELIUM_CONFIG_FILEPATH";

    /**
     * Returns the absolute location of the {@code application.yml} the application runs with.
     *
     * <p>The single source of that location: the YAML migrator patches this file, Spring loads it
     * as its default {@code spring.config.location}, and the config editor reads and writes it.
     * Resolved before the Spring context exists, because the YAML migrator patches the file
     * before Spring reads it. Precedence matches Spring's: the {@value #APP_YML_PROPERTY} system
     * property, then the {@value #APP_YML_ENV} environment variable, then {@link #APP_YML}. A
     * relative value is resolved against the working directory.
     */
    static Path appYmlPath() {
        String location = System.getProperty(APP_YML_PROPERTY);
        if (location == null || location.isBlank()) {
            location = System.getenv(APP_YML_ENV);
        }
        if (location == null || location.isBlank()) {
            location = APP_YML;
        }
        return Paths.get(location.trim()).toAbsolutePath().normalize();
    }
}
