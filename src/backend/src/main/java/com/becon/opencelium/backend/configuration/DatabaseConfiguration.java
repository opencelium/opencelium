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

package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.enums.RepositoryEnum;
import jakarta.persistence.EntityManagerFactory;
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.neo4j.core.transaction.Neo4jTransactionManager;
import org.springframework.data.neo4j.repository.config.EnableNeo4jRepositories;
import org.springframework.data.transaction.ChainedTransactionManager;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;

@Configuration
@EnableNeo4jRepositories(basePackages = PathConstant.NEO4J)
@EnableJpaRepositories(basePackages = PathConstant.MYSQl, transactionManagerRef = "mysqlTransactionManager")
@EnableElasticsearchRepositories(basePackages = PathConstant.ELASTICSEARCH)
@EnableTransactionManagement
public class DatabaseConfiguration {

    @Autowired
    private Environment env;

    // ----------------------------------------- Neo4j -----------------------------------------------------------------
    @Bean
    public Driver neo4jDriver() {
        // with domain entity base package(s)
//        return new SessionFactory(configuration(), RepositoryEnum.NEO4J.getPath());
        String url = env.getProperty("spring.neo4j.url");
        String username = env.getProperty("spring.neo4j.authentication.username");
        String password = env.getProperty("spring.neo4j.authentication.password");
        if (username == null || password == null ) {
            throw new RuntimeException("Neo4j Username or Password is NOT set in application.yml(path: spring.neo4j.authentication)");
        }
        return GraphDatabase.driver(url, AuthTokens.basic(username,password));
    }
//
//    @Bean
//    public org.neo4j.ogm.config.Configuration configuration() {
//        String url = env.getProperty("spring.data.neo4j.url");
//        String username = env.getProperty("spring.data.neo4j.username");
//        String password = env.getProperty("spring.data.neo4j.password");
//
//        return new org.neo4j.ogm.config.Configuration.Builder()
//                .uri(url)
//                .credentials(username, password)
//                .build();
//    }
//
    @Bean(name = "neo4jTransactionManager")
    public Neo4jTransactionManager neo4jTransactionManager() {
        return new Neo4jTransactionManager(neo4jDriver());
    }

// ----------------------------------------- MariaDB -----------------------------------------------------------------

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties firstDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSource dataSource(){
        return firstDataSourceProperties().initializeDataSourceBuilder().build();
    }

    @Bean
    @Primary
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("dataSource") DataSource dataSource) {

        return builder
                .dataSource(dataSource)
                .packages(RepositoryEnum.MYSQL.getPath())
                .build();
    }

    @Bean(name = "mysqlTransactionManager")
    @Primary
    public JpaTransactionManager mysqlTransactionManager(
            @Qualifier("entityManagerFactory") EntityManagerFactory entityManagerFactory) {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(entityManagerFactory);

        return transactionManager;
    }

    // -----------------------------------------------------------------------------------------------------------------
    @Autowired
    @Bean(name = "transactionManager")
    public PlatformTransactionManager transactionManager(Neo4jTransactionManager neo4jTransactionManager,
                                                         JpaTransactionManager mysqlTransactionManager) {
        return new ChainedTransactionManager(
                mysqlTransactionManager,
                neo4jTransactionManager
        );
    }
}
