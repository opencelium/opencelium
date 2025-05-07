package com.becon.opencelium.backend.configuration.interceptors;

import com.becon.opencelium.backend.commons.ThreadLocalSingleton;
import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.constant.HeaderConstants;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import static java.util.Objects.requireNonNullElse;

@Component
public class UserInterceptor implements HandlerInterceptor {

    @Value(AppYamlPath.CONNECTOR_MASTER_PASSWORD)
    private String masterPassword;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String masterPassword = requireNonNullElse(request.getHeader(HeaderConstants.MASTER_PASSWORD), null);
        ThreadLocalSingleton.setHasMasterPassword(this.masterPassword != null && this.masterPassword.equals(masterPassword));
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        ThreadLocalSingleton.remove();
    }
}
