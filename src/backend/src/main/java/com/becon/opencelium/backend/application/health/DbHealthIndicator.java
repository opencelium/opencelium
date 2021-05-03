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

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.dao.support.DataAccessUtils;
import org.springframework.jdbc.IncorrectResultSetColumnCountException;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.JdbcUtils;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;
import java.sql.*;
import java.util.List;


@Component
public class DbHealthIndicator extends AbstractHealthIndicator implements InitializingBean {

    private static final String DEFAULT_QUERY = "SELECT 1";

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void afterPropertiesSet() throws Exception {
        System.err.println("After properties set");
    }

    @Override
    protected void doHealthCheck(Health.Builder builder) throws Exception {
        builder.withDetail("version", getProductVersion());
        if (this.dataSource == null) {
            builder.up().withDetail("database", "unknown");
        }
        else {
            doDataSourceHealthCheck(builder);
        }
    }

    private void doDataSourceHealthCheck(Health.Builder builder) throws Exception {
        String product = getProduct();
        builder.up().withDetail("database", product);
        String validationQuery = DEFAULT_QUERY;
        if (StringUtils.hasText(validationQuery)) {
            // Avoid calling getObject as it breaks MySQL on Java 7
            List<Object> results = this.jdbcTemplate.query(validationQuery, new DbHealthIndicator.SingleColumnRowMapper());
            Object result = DataAccessUtils.requiredSingleResult(results);
            builder.withDetail("result", result);
        }
    }

    private String getProductVersion() {
        try {
            DatabaseMetaData metaData = dataSource.getConnection().getMetaData();
            return dataSource.getConnection().getMetaData().getDatabaseProductVersion();
        } catch (SQLException e){
            e.printStackTrace();
            return "Service is down. Unable to detect version.";
        }
    }

    private String getProduct() {
        return this.jdbcTemplate.execute((ConnectionCallback<String>) this::getProduct);
    }

    private String getProduct(Connection connection) throws SQLException {
        return connection.getMetaData().getDatabaseProductName();
    }

    private static class SingleColumnRowMapper implements RowMapper<Object> {

        @Override
        public Object mapRow(ResultSet rs, int rowNum) throws SQLException {
            ResultSetMetaData metaData = rs.getMetaData();
            int columns = metaData.getColumnCount();
            if (columns != 1) {
                throw new IncorrectResultSetColumnCountException(1, columns);
            }
            return JdbcUtils.getResultSetValue(rs, 1);
        }

    }
}
