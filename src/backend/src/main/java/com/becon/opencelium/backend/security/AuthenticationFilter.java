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

import com.becon.opencelium.backend.constant.SecurityConstant;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.user.UserResource;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;

@Component
public class AuthenticationFilter extends UsernamePasswordAuthenticationFilter {

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Override
    @Autowired
    public void setAuthenticationManager(AuthenticationManager authenticationManager) {
        super.setAuthenticationManager(authenticationManager);
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) {
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
        UserPrincipals userPrincipals = (UserPrincipals) auth.getPrincipal();
        User user = userPrincipals.getUser();
        UserResource userResource = new UserResource(user);

        String payload = mapper.writeValueAsString(userResource);
        String token = jwtTokenUtil.generateToken(userPrincipals);

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(payload);
        response.addHeader(HttpHeaders.AUTHORIZATION, SecurityConstant.BEARER + " " + token);
    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request,
                                              HttpServletResponse response, AuthenticationException failed)
                                                                            throws IOException, ServletException {
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
}
