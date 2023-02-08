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
import com.becon.opencelium.backend.mysql.service.ActivityServiceImpl;
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

import java.io.IOException;

public class AuthorizationFilter extends BasicAuthenticationFilter {

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private ActivityServiceImpl activityService;

    public AuthorizationFilter(AuthenticationManager authenticationManager) {
        super(authenticationManager);
    }

    @Override
    protected void doFilterInternal( HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain ) throws IOException, ServletException {

        String url  = request.getRequestURI();
        System.out.println(url);
        if (url.contains("api/webhook/execute") || url.contains("api/storage/files") ||
                url.contains("api/webhook/health")){

            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Access-Control-Allow-Methods",
                    "ACL, CANCELUPLOAD, CHECKIN, CHECKOUT, COPY, DELETE, GET, HEAD, LOCK, MKCALENDAR, MKCOL, MOVE, OPTIONS, POST, PROPFIND, PROPPATCH, PUT, REPORT, SEARCH, UNCHECKOUT, UNLOCK, UPDATE, VERSION-CONTROL");
            response.setHeader("Access-Control-Max-Age", "3600");
            response.setHeader("Access-Control-Allow-Headers",
                    "Origin, X-Requested-With, Content-Type, Accept, Key, Authorization");
            chain.doFilter(request, response);
            return;
        }
        String token = extractTokenFromRequest(request);
        if (token == null || !token.startsWith(SecurityConstant.BEARER)){
            chain.doFilter(request, response);
            throw new WrongHeaderAuthTypeException(token);
        }
        String jwt = token.substring(7);
        UsernamePasswordAuthenticationToken auth = getAuthentication(jwt);
        SecurityContextHolder.getContext().setAuthentication(auth);
        chain.doFilter(request, response);
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String token = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (token == null) {
            return request.getParameter("token");
        }
        return token;
    }

    private UsernamePasswordAuthenticationToken getAuthentication(String token) {
        String email = jwtTokenUtil.getEmailFromToken(token);
        UserPrincipals userDetail = (UserPrincipals) userDetailsService.loadUserByUsername(email);

        if (!jwtTokenUtil.validateToken(token, userDetail)){
            return null;
        }

        activityService.registerTokenActivity(userDetail);
        return new UsernamePasswordAuthenticationToken(userDetail,
                                                       null,
                                                       userDetail.getAuthorities());
    }
}
