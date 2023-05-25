package com.becon.opencelium.backend.security;

import com.becon.opencelium.backend.exception.WrongHeaderAuthTypeException;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.ServletWebRequest;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URI;

@Component
public class AuthExceptionHandler implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
        String path = request.getRequestURI();
        authException.printStackTrace();
        ErrorResource errorResource =  new ErrorResource(authException, HttpStatus.FORBIDDEN, path);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        OutputStream responseStream = response.getOutputStream();
        ObjectMapper mapper = new ObjectMapper();
        mapper.writeValue(responseStream, errorResource);
        responseStream.flush();
    }
}
