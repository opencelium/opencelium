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
import com.becon.opencelium.backend.exception.WrongHeaderAuthTypeException;
import com.becon.opencelium.backend.mysql.entity.Activity;
import com.becon.opencelium.backend.mysql.entity.User;
import com.becon.opencelium.backend.mysql.repository.UserRepository;
import com.becon.opencelium.backend.mysql.service.ActivityServiceImpl;
import org.apache.http.HttpHeaders;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.stereotype.Component;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Date;

@Component
public class AuthorizationFilter extends BasicAuthenticationFilter {

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private JwtUserDetailsService jwtUserDetailsService;

    @Autowired
    private ActivityServiceImpl activityService;

    @Autowired
    public AuthorizationFilter(AuthenticationManager authenticationManager) {
        super(authenticationManager);
    }

    // TODO: filter executes twice. FIX IT AS SOON AS POSSIBLE
    @Override
    protected void doFilterInternal( HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain ) throws IOException, ServletException {

        String url  = request.getRequestURI();
        if (url.contains("api/webhook/execute")){
            chain.doFilter(request, response);
            return;
        }

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith(SecurityConstant.BEARER)){
            chain.doFilter(request, response);
            throw new WrongHeaderAuthTypeException(header);
        }

        String token = request.getHeader(HttpHeaders.AUTHORIZATION)
                                .replace(SecurityConstant.BEARER + " ", "");
        UsernamePasswordAuthenticationToken auth = getAuthentication(token);
        SecurityContextHolder.getContext().setAuthentication(auth);
        chain.doFilter(request, response);
    }

    private UsernamePasswordAuthenticationToken getAuthentication(String token) {
        String email = jwtTokenUtil.getEmailFromToken(token);
        UserPrincipals userDetail = (UserPrincipals) jwtUserDetailsService.loadUserByUsername(email);

        if (!jwtTokenUtil.validateToken(token, userDetail)){
            return null;
        }

        activityService.registerTokenActivity(userDetail);
        return new UsernamePasswordAuthenticationToken(userDetail,
                                                       null,
                                                       userDetail.getAuthorities());
    }
}
