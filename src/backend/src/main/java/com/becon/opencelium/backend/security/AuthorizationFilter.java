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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Objects;
import java.util.Optional;

@Component
public class AuthorizationFilter extends OncePerRequestFilter {

    /** The query parameter a WebSocket client sends its bearer token in. */
    private static final String TOKEN_PARAMETER = "token";

    private final JwtTokenUtil jwtTokenUtil;
    private final UserService userService;
    private final SessionServiceImpl sessionService;
    // the WebSocket endpoint as a path: a leading slash, no trailing one
    private final String websocketPath;

    /**
     * @param websocketEndpoint the path of the WebSocket endpoint, the only one that takes a token
     *                          in the URL
     * @throws IllegalStateException if the endpoint is the root path, which would let a token in
     *                               the URL authenticate every request
     */
    public AuthorizationFilter(JwtTokenUtil jwtTokenUtil, UserService userService,
            SessionServiceImpl sessionService, @Value("${websocket.endpoint}") String websocketEndpoint) {
        this.jwtTokenUtil = jwtTokenUtil;
        this.userService = userService;
        this.sessionService = sessionService;
        this.websocketPath = toPath(websocketEndpoint);
    }

    @Override
    protected void doFilterInternal( HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain ) throws IOException, ServletException {

        String token = extractToken(request).orElse(null);
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

    /**
     * Returns the token of the request: its {@code Authorization} header or, on the WebSocket
     * endpoint only, its {@code token} query parameter. A browser cannot set headers on a
     * WebSocket or on the SockJS fallbacks, so the frontend sends its token in the URL there.
     * Anywhere else a token in the URL is ignored: URLs end up in access logs, browser history
     * and pasted links, where a header never goes.
     */
    private Optional<String> extractToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null) {
            return Optional.of(header);
        }
        return isWebSocketRequest(request)
                ? Optional.ofNullable(request.getParameter(TOKEN_PARAMETER))
                : Optional.empty();
    }

    /**
     * Tells whether the request goes to the WebSocket endpoint or below it, like SockJS's
     * {@code /ws/info}. The servlet path is the one the container decoded, normalised and serves,
     * so {@code /ws/../connection/all} counts as the {@code /connection/all} it is served as.
     */
    private boolean isWebSocketRequest(HttpServletRequest request) {
        String path = request.getServletPath() + Objects.toString(request.getPathInfo(), "");
        return path.equals(websocketPath) || path.startsWith(websocketPath + "/");
    }

    // "/ws", "ws" and "/ws/" all name the path /ws
    private static String toPath(String endpoint) {
        String path = "/" + endpoint.strip().replaceAll("^/+|/+$", "");
        if (path.equals("/")) {
            throw new IllegalStateException(
                    "websocket.endpoint must name a path below '/', not '" + endpoint + "'");
        }
        return path;
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
