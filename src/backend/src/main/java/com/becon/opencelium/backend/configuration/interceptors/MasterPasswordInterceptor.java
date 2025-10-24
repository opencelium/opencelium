package com.becon.opencelium.backend.configuration.interceptors;

import com.becon.opencelium.backend.commons.ThreadLocalSingleton;
import com.becon.opencelium.backend.constant.props.ConnectorProps;
import com.becon.opencelium.backend.constant.HeaderConstants;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import static java.util.Objects.requireNonNullElse;

@Component
public class MasterPasswordInterceptor implements HandlerInterceptor {

    private final ConnectorProps connectorProps;

    public MasterPasswordInterceptor(ConnectorProps connectorProps) {
        this.connectorProps = connectorProps;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String masterPassword = requireNonNullElse(request.getHeader(HeaderConstants.MASTER_PASSWORD), StringUtils.EMPTY);
        ThreadLocalSingleton.setHasMasterPassword(StringUtils.isNotBlank(connectorProps.getMasterPassword()) && connectorProps.getMasterPassword().equals(masterPassword));
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        ThreadLocalSingleton.remove();
    }
}
