package com.becon.opencelium.backend.utility;

import com.becon.opencelium.backend.constant.SecurityConstant;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class TokenUtility {

    private String secret;
    private Long activityTime;
    private Long expirationTime;

    @Autowired
    private Environment env;

    public String getSecret() {
        secret = env.getProperty("secret");
        if (secret == null) {
            secret = SecurityConstant.SECRET;
        }
        return secret;
    }

    public long getActitvityTime() {
        activityTime = env.getProperty("opencelium.token.activity-time", Long.class);
        if (activityTime == null) {
            activityTime = SecurityConstant.ACTIVITY_TIME;
        }
        return activityTime * 1000; // should be in ms
    }

    public long getExpirationTime() {
        expirationTime = env.getProperty("opencelium.token.expiration-time", Long.class);
        if (expirationTime == null) {
            expirationTime = SecurityConstant.EXPIRATION_TIME;
        }
        return expirationTime * 1000;
    }
}
