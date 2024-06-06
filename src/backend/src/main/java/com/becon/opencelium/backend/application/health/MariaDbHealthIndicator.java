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

package com.becon.opencelium.backend.application.health;

import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.*;


@Component("mariaDB")
public class MariaDbHealthIndicator extends AbstractHealthIndicator {

    private final DataSource dataSource;

    public MariaDbHealthIndicator(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    protected void doHealthCheck(Health.Builder builder) throws Exception {
        try (Connection connection = dataSource.getConnection()) {

            builder.withDetail("version", connection.getMetaData().getDatabaseProductVersion());
            builder.up()
                    .withDetail("name", connection.getMetaData().getDatabaseProductName());
        } catch (Exception e) {
            builder.down()
                    .withDetail("error", "MariaDB is down");
        }
    }
}
