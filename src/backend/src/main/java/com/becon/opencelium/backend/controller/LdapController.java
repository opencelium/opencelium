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

import com.becon.opencelium.backend.configuration.LdapProperties;
import com.becon.opencelium.backend.resource.LdapConfigDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.naming.directory.Attributes;

@Controller
@Tag(name = "Ldap", description = "To retrieve ldap configuration and test connection to ldap server")
@RequestMapping(value = "/api/ldap")
public class LdapController {

    @Autowired
    private LdapProperties properties;

    @Operation(summary = "")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/default/config")
    public ResponseEntity<LdapConfigDTO> profilePictureUpload() {
        LdapConfigDTO result = new LdapConfigDTO();

        result.setUrl(properties.getUrls());
        result.setBaseDN(properties.getBase());
        result.setUserDN(properties.getUserSearchBase());
        result.setGroupDN(properties.getGroupSearchBase());
        result.setReadAccountDN(properties.getUsername());
        result.setReadAccountPassword(properties.getPassword());
        result.setUserSearchFilter(properties.getUserSearchFilter());
        result.setGroupSearchFilter(properties.getGroupSearchFilter());

        return ResponseEntity.ok(result);
    }

    @Operation(summary = "")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping("/test")
    public ResponseEntity<?> groupPictureUpload(@RequestBody LdapConfigDTO request) {
        try {
            LdapContextSource contextSource = new LdapContextSource();
            contextSource.setUrl(request.getUrl());
            contextSource.setBase(request.getBaseDN());
            contextSource.setUserDn(request.getReadAccountDN());
            contextSource.setPassword(request.getReadAccountPassword());
            contextSource.afterPropertiesSet();

            LdapTemplate ldapTemplate = new LdapTemplate(contextSource);

            ldapTemplate.search(
                    request.getUserDN(),
                    request.getUserSearchFilter(),
                    Attributes::clone
            );

            return ResponseEntity.ok("LDAP connection successful");
        } catch (Exception e) {
            return ResponseEntity.ok(e.getMessage());
        }
    }
}
