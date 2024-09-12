package com.becon.opencelium.backend.security;

import com.becon.opencelium.backend.constant.SecurityConstant;
import com.becon.opencelium.backend.database.mysql.entity.Session;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.service.TotpService;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.user.UserResource;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.Optional;

@Component
public class TotpAuthenticationFilter extends AuthenticationFilter {

    @Autowired
    private TotpService totpService;

    public TotpAuthenticationFilter() {
        setFilterProcessesUrl("/totp-validate");
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {
        if (!request.getMethod().equals("POST")) {
            throw new AuthenticationServiceException("Authentication method not supported: " + request.getMethod());
        }

        String sessionId = request.getHeader("session_id");
        String code = request.getParameter("code");
        Session session = sessionService.findById(sessionId)
                .orElseThrow(() -> new AuthenticationServiceException("Invalid 'session_id' has been supplied"));
        User user = session.getUser();

        if (session.getAttempts() < 4 && totpService.isValidTotp(user.getTotpSecretKey(), code)) {
            UserPrincipals userDetails = new UserPrincipals(user);
            return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        }

        throw new AuthenticationServiceException("Invalid TOTP 'code' has been supplied");
    }

    @Override
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                            FilterChain chain, Authentication auth) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        User user = ((UserPrincipals) auth.getPrincipal()).getUser();
        UserResource userResource = new UserResource(user);
        String payload = mapper.writeValueAsString(userResource);
        String token = jwtTokenUtil.generateToken(user);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(payload);
        response.addHeader(HttpHeaders.AUTHORIZATION, SecurityConstant.BEARER + " " + token);
    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                              AuthenticationException failed) throws IOException {
        final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        ObjectMapper mapper = new ObjectMapper();
        String sessionId = request.getHeader("session_id");
        Optional<Session> optionalSession = sessionService.findById(sessionId);
        response.setContentType("application/json");
        ErrorResource errorResource = new ErrorResource(failed, HttpStatus.UNAUTHORIZED, uri.getPath());
        if (optionalSession.isEmpty()) {
            errorResource.setMessage("Invalid 'session_id' has been supplied");
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
        } else if (optionalSession.get().getAttempts() < 4) {
            Session session = optionalSession.get();
            session.setAttempts(session.getAttempts() + 1);
            sessionService.save(session);
            errorResource.setMessage(String.format("'session_id' or 'code' did not match. You have %d attempts remaining.", 5 - session.getAttempts()));
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
        } else {
            errorResource.setMessage("Too many failed attempts");
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        }
        String payload = mapper.writeValueAsString(errorResource);
        response.getWriter().write(payload);
    }
}
