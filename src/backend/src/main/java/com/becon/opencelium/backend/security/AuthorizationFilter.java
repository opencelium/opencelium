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
import com.becon.opencelium.backend.database.mysql.service.SessionServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserService;
import com.nimbusds.jwt.JWTClaimsSet;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.hc.core5.http.HttpHeaders;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AuthorizationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private UserService userService;

    @Autowired
    private SessionServiceImpl sessionService;

    @Override
    protected void doFilterInternal( HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain ) throws IOException, ServletException {

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

    private static String extractTokenFromRequest(HttpServletRequest request) {
        String token = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (token == null) {
            return request.getParameter("token");
        }
        return token;
    }

    /**
     * Resolves the user a bearer token belongs to, or {@code null} when it grants nothing, which
     * leaves the request unauthenticated for the entry point to reject.
     *
     * <p>The signature is verified before anything else, and the user is then loaded by the
     * {@code userId} claim rather than by the subject: the subject is the email or username, a
     * value the user can change and that is not unique across OC and LDAP accounts, while the id
     * is immutable. Loading only after verification also means a forged token cannot probe which
     * identifiers exist, and an unknown user gets the same answer as a bad signature instead of
     * an error response.
     */
    private UsernamePasswordAuthenticationToken getAuthentication(String token) {
        JWTClaimsSet claims = jwtTokenUtil.verify(token).orElse(null);
        if (claims == null) {
            return null;
        }

        User user = jwtTokenUtil.userIdOf(claims)
                .flatMap(userService::findByIdNoLock)
                .orElse(null);
        if (user == null || !jwtTokenUtil.belongsToActiveSession(claims, user)) {
            return null;
        }

        sessionService.updateLastAccessedTime(claims.getJWTID());

        UserPrincipals principals = new UserPrincipals(user);
        return new UsernamePasswordAuthenticationToken(principals, null, principals.getAuthorities());
    }
}
