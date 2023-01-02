package com.becon.opencelium.backend.configuration;

import jakarta.servlet.annotation.WebListener;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextListener;

@Configuration
@WebListener
public class SecurityContextListener extends RequestContextListener {
}
