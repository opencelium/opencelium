package com.becon.opencelium.backend.application.health;

import com.becon.opencelium.backend.application.assistant.UpdatePackageServiceImp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

@Component
public class EmailHealthIndicator extends AbstractHealthIndicator {

    @Autowired(required = false)
    private JavaMailSenderImpl mailSender;

    private Logger logger = LoggerFactory.getLogger(EmailHealthIndicator.class);

    @Override
    protected void doHealthCheck(Health.Builder builder) throws Exception {
        try {
            if (this.mailSender.getHost() == null || this.mailSender.getPort() == -1) {
                builder.down().withDetail("error", "Host or Port is not set.");
                return;
            }
        } catch (Exception e) {
            builder.down().withDetail("error", e.getMessage());
            return;
        }

        try {
            builder.withDetail("location", this.mailSender.getHost() + ":" + this.mailSender.getPort());
            this.mailSender.testConnection();
            builder.up();
        } catch (Exception e) {
            builder.down().withDetail("error", e.getMessage());
        }
    }
}
