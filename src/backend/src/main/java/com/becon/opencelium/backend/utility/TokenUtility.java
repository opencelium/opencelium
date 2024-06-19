package com.becon.opencelium.backend.utility;

import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.constant.SecurityConstant;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class TokenUtility {

    @Autowired
    private Environment env;

    public String getSecret() {
        String secret = env.getProperty(AppYamlPath.TOKEN_SECRET);
        if (secret == null) {
            secret = SecurityConstant.SECRET;
        }
        return secret;
    }

    public long getActivityTime() {
        Long activityTime = env.getProperty(AppYamlPath.TOKEN_ACTIVITY_TIME, Long.class);
        if (activityTime == null) {
            activityTime = SecurityConstant.ACTIVITY_TIME;
        }
        return activityTime * 1000; // should be in ms
    }

    public long getExpirationTime() {
        Long expirationTime = env.getProperty(AppYamlPath.TOKEN_EXPIRE_TIME, Long.class);
        if (expirationTime == null) {
            expirationTime = SecurityConstant.EXPIRATION_TIME;
        }
        return expirationTime * 1000;
    }
}
