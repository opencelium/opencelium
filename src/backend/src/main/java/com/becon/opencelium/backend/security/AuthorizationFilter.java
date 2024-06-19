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
import com.becon.opencelium.backend.database.mysql.service.ActivityServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.hc.core5.http.HttpHeaders;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;

@Component
public class AuthorizationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private ActivityServiceImpl activityService;

    @Override
    protected void doFilterInternal( HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain ) throws IOException, ServletException {

        String url  = request.getRequestURI();
        System.out.println(url);
        String token = extractTokenFromRequest(request);
        if (token == null || !token.startsWith(SecurityConstant.BEARER)){
            chain.doFilter(request, response);
            return;
        }
        String jwt = token.substring(7);
        UsernamePasswordAuthenticationToken auth = getAuthentication(jwt);
        SecurityContextHolder.getContext().setAuthentication(auth);
        chain.doFilter(request, response);
    }

    private void disableCrosOrigin(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Access-Control-Allow-Methods",
                "ACL, CANCELUPLOAD, CHECKIN, CHECKOUT, COPY, DELETE, GET, HEAD, LOCK, MKCALENDAR, MKCOL, MOVE, OPTIONS, POST, PROPFIND, PROPPATCH, PUT, REPORT, SEARCH, UNCHECKOUT, UNLOCK, UPDATE, VERSION-CONTROL");
        response.setHeader("Access-Control-Max-Age", "3600");
        response.setHeader("Access-Control-Allow-Headers",
                "Origin, X-Requested-With, Content-Type, Accept, Key, Authorization");
        response.setHeader("Content-Type", "application/json");
    }

//    private boolean containsInIgnoreList(String s) {
//        return ignorList.stream().anyMatch(s::contains);
//    }

    private static String extractTokenFromRequest(HttpServletRequest request) {
        String token = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (token == null) {
            return request.getParameter("token");
        }
        return token;
    }

    private UsernamePasswordAuthenticationToken getAuthentication(String token) {
        String email = jwtTokenUtil.getEmailFromToken(token);
        UserPrincipals userDetail = (UserPrincipals) userDetailsService.loadUserByUsername(email);

        try {
            if (!jwtTokenUtil.validateToken(token, userDetail)){
                return null;
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        activityService.registerTokenActivity(userDetail);
        return new UsernamePasswordAuthenticationToken(userDetail,
                                                       null,
                                                       userDetail.getAuthorities());
    }
}
