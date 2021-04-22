package com.becon.opencelium.backend.application.health;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

@Component
public class EmailHealthIndicator extends AbstractHealthIndicator {

    @Autowired
    private JavaMailSenderImpl mailSender;

    @Override
    protected void doHealthCheck(Health.Builder builder) throws Exception {
        builder.withDetail("location", this.mailSender.getHost() + ":" + this.mailSender.getPort());
        this.mailSender.testConnection();
        builder.up();
    }
}
