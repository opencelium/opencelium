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

package com.becon.opencelium.backend.controller;

import com.zaxxer.hikari.pool.HikariPool;
import org.springframework.beans.DirectFieldAccessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.util.List;

@RestController
@RequestMapping(value = "/api/application", produces = "application/hal+json", consumes = {"application/json"})
public class ApplicationController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private Environment env;

    @GetMapping("/all")
    public List<String> getAll(){
        DataSource dataSource = (DataSource) jdbcTemplate.getDataSource();
        HikariPool hikariPool = (HikariPool) new DirectFieldAccessor(dataSource).getPropertyValue("pool");
        System.out.println(hikariPool.toString());
        return null;
    }

    @GetMapping("/oc/test")
    public ResponseEntity<?> ocTest(){
        return ResponseEntity.ok().build();
    }

    @GetMapping("/oc/version")
    public ResponseEntity<?> ocCurrentVersion(){
        String version = env.getProperty("opencelium.version");
        String result = "{" + "\"version\": \"" + version + "\"}";
        return ResponseEntity.ok(result);
    }

    public String get(){
        return null;
    }
}
