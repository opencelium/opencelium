package com.becon.opencelium.backend.commons.filter;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.constant.ExceptionMessages;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.security.SecurityAuditorAware;
import com.becon.opencelium.backend.security.UserPrincipals;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class OwnershipSecurity {

    private static final String ADMIN_ROLE = "Admin";

    private final SecurityAuditorAware securityAuditorAware;

    public OwnershipSecurity(SecurityAuditorAware securityAuditorAware) {
        this.securityAuditorAware = securityAuditorAware;
    }

    public boolean isOwner(OwnableEntity entity) {
        Integer currentUserId = securityAuditorAware.getCurrentAuditor().orElse(-1);
        return currentUserId.equals(entity.getCreatedBy());
    }

    public boolean isAdmin() {
        UserPrincipals principals = (UserPrincipals) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return ADMIN_ROLE.equals(principals.getUser().getUserRole().getName());
    }

    public void checkOwnership(OwnableEntity entity) {
        Integer currentUserId = securityAuditorAware.getCurrentAuditor().orElse(-1);
        if (!currentUserId.equals(entity.getCreatedBy())) {
            throw new GeneralServiceException(HttpStatus.FORBIDDEN, ExceptionConstant.FORBIDDEN, ExceptionMessages.ONLY_OWNER_CAN_PERFORM_ACTION);
        }
    }

    public void checkOwnerOrAdmin(OwnableEntity entity) {
        if (!isAdmin() && !isOwner(entity)) {
            throw new GeneralServiceException(HttpStatus.FORBIDDEN, ExceptionConstant.FORBIDDEN, ExceptionMessages.ONLY_OWNER_OR_ADMIN_CAN_PERFORM_ACTION);
        }
    }
}
