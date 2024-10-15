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

package com.becon.opencelium.backend.security;

import com.becon.opencelium.backend.configuration.LdapProperties;
import com.becon.opencelium.backend.constant.SecurityConstant;
import com.becon.opencelium.backend.database.mysql.entity.Session;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.entity.UserDetail;
import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import com.becon.opencelium.backend.database.mysql.service.SessionService;
import com.becon.opencelium.backend.database.mysql.service.TotpService;
import com.becon.opencelium.backend.database.mysql.service.UserRoleService;
import com.becon.opencelium.backend.database.mysql.service.UserService;
import com.becon.opencelium.backend.enums.AuthMethod;
import com.becon.opencelium.backend.enums.LangEnum;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.user.TotpResource;
import com.becon.opencelium.backend.resource.user.UserResource;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.ldap.userdetails.LdapUserDetails;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.Collection;
import java.util.UUID;

@Component
public class AuthenticationFilter extends UsernamePasswordAuthenticationFilter {

    @Autowired
    protected JwtTokenUtil jwtTokenUtil;

    @Autowired
    private UserRoleService userRoleService;

    @Autowired
    protected UserService userService;

    @Autowired
    protected SessionService sessionService;

    @Autowired
    protected TotpService totpService;

    @Autowired
    private LdapProperties properties;

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationFilter.class);

    @Override
    @Autowired
    public void setAuthenticationManager(AuthenticationManager authenticationManager) {
        super.setAuthenticationManager(authenticationManager);
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) {
        if (!request.getMethod().equals("POST")) {
            throw new AuthenticationServiceException("Authentication method not supported: " + request.getMethod());
        }
        try {
            User user = new ObjectMapper()
                    .readValue(request.getInputStream(), User.class);
            return getAuthenticationManager().authenticate(
                    new UsernamePasswordAuthenticationToken(
                            user.getEmail(),
                            user.getPassword(),
                            new ArrayList<>()));
        }
        catch (IOException e){
            throw new RuntimeException(e);
        }
    }

    @Override
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                            FilterChain chain, Authentication auth) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        User user = getUser(auth);

        if (user.getTotpSecretKey() != null) {
            TotpResource resource;
            if (user.isTotpProcessCompleted()) {
                // if TOTP process has been completed then just send sessionId
                String sessionId = user.getSession().getId();

                resource = new TotpResource(sessionId);
            } else {
                // if TOTP has not been completed then send QR and secretKey
                resource = totpService.getTotpResource(user);
            }

            String payload = mapper.writeValueAsString(resource);

            response.getWriter().write(payload);
        } else {
            UserResource userResource = new UserResource(user);

            String payload = mapper.writeValueAsString(userResource);
            String token = jwtTokenUtil.generateToken(user);

            response.getWriter().write(payload);
            response.addHeader(HttpHeaders.AUTHORIZATION, SecurityConstant.BEARER + " " + token);
        }

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                              AuthenticationException failed) throws IOException {
        final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        ObjectMapper mapper = new ObjectMapper();

        ErrorResource errorResource = new ErrorResource(failed,
                HttpStatus.UNAUTHORIZED,
                uri.getPath());
        String payload = mapper.writeValueAsString(errorResource);

        response.setContentType("application/json");
        response.getWriter().write(payload);
        response.setStatus(HttpStatus.FORBIDDEN.value());
    }


    private User getUser(Authentication authentication) {
        User result;
        Object principal = authentication.getPrincipal();
        String authType;

        if (principal instanceof LdapUserDetails ldapUserDetails) {
            String email = ldapUserDetails.getUsername();

            User user = userService.findByEmail(email).orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setAuthMethod(AuthMethod.LDAP);

                // create details for new user
                UserDetail userDetail = new UserDetail();
                userDetail.setLang(LangEnum.EN.getCode());
                userDetail.setTutorial(false);
                userDetail.setUser(newUser);

                newUser.setUserDetail(userDetail);

                return newUser;
            });

            Collection<? extends GrantedAuthority> authorities = ldapUserDetails.getAuthorities();
            String roleName = authorities.stream()
                    .map(GrantedAuthority::getAuthority)
                    .findFirst()
                    .orElse(properties.getDefaultRole());

            UserRole role = userRoleService.findByRole(roleName)
                    .orElseThrow(() -> new EntityNotFoundException("LDAP group mapped to role = '" + roleName + "', but it does not exists in OC system."));
            user.setUserRole(role);

            result = userService.save(user);
            authType = "LDAP server";
        } else {
            result = ((UserPrincipals) authentication.getPrincipal()).getUser();
            authType = "OC system";
        }
        createNewSession(result);

        if (properties.isShowLogs()) {
            logger.info("User " + result.getEmail() + " is authenticated via " + authType);
        }

        return result;
    }

    private void createNewSession(User user) {
        int userId = user.getId();
        String sessionId = UUID.randomUUID().toString();

        // if 'user' already has a 'session' then delete it and create new one
        sessionService.deleteByUserId(userId);

        Session session = new Session();

        session.setId(sessionId);
        session.setUserId(userId);
        session.setActive(true);
        session.setAttempts(0);

        sessionService.save(session);

        user.setSession(session);
    }
}
