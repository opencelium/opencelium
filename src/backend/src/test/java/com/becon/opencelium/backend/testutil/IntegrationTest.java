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

package com.becon.opencelium.backend.testutil;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Composed annotation for full-stack integration tests.
 *
 * Bundles the boilerplate that every @SpringBootTest + Testcontainers class
 * needs so that contributors apply one annotation instead of remembering
 * the combination and the correct profile.
 *
 * Equivalent to:
 *   @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
 *   @Testcontainers
 *   @ActiveProfiles("integration")
 *
 * Usage:
 *   @IntegrationTest
 *   class UserRoleControllerIT {
 *
 *       @Container
 *       static MariaDBContainer<?> mariaDB = new MariaDBContainer<>("mariadb:11.3");
 *
 *       @DynamicPropertySource
 *       static void overrideProperties(DynamicPropertyRegistry registry) { … }
 *   }
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("integration")
public @interface IntegrationTest {
}
