/*
 * // Copyright (C) <2026> <becon GmbH>
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

package com.becon.opencelium.backend.integration.controller;

import com.becon.opencelium.backend.testutil.annotation.IntegrationTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MariaDBContainer;
import org.testcontainers.junit.jupiter.Container;

@IntegrationTest
public class UserRoleControllerIT {
    @Container
    static MariaDBContainer<?> mariaDB = new MariaDBContainer<>("mariadb:11.3");

    /*
     * Testcontainers assigns a random port every time a container starts,
     * so the port is not known until runtime — never hard-code it.
     *
     * @DynamicPropertySource tells Spring to call this method before the
     * ApplicationContext starts. The method reads the actual JDBC URL,
     * username, and password from the running container and registers them
     * as Spring properties, overwriting the placeholder values in
     * application-integration.yml.
     *
     * Two rules:
     *   1. The method must be static — the context does not exist yet when
     *      Spring calls it, so there is no instance available.
     *   2. The method must be in the same class as @Container — the container
     *      must already be running when the method executes.
     */
    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",      mariaDB::getJdbcUrl);
        registry.add("spring.datasource.username", mariaDB::getUsername);
        registry.add("spring.datasource.password", mariaDB::getPassword);
    }
}
