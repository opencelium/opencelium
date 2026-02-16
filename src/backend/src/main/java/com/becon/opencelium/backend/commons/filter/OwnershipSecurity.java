package com.becon.opencelium.backend.commons.filter;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.constant.ExceptionMessages;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.security.SecurityAuditorAware;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component("ownershipSecurity")
public class OwnershipSecurity {

    private final SecurityAuditorAware securityAuditorAware;

    public OwnershipSecurity(SecurityAuditorAware securityAuditorAware) {
        this.securityAuditorAware = securityAuditorAware;
    }

    public boolean isOwner(OwnableEntity entity) {
        Integer currentUserId = securityAuditorAware.getCurrentAuditor().orElse(-1);
        return currentUserId.equals(entity.getCreatedBy());
    }

    public void checkOwnership(OwnableEntity entity) {
        Integer currentUserId = securityAuditorAware.getCurrentAuditor().orElse(-1);
        if (!currentUserId.equals(entity.getCreatedBy())) {
            throw new GeneralServiceException(HttpStatus.FORBIDDEN, ExceptionConstant.FORBIDDEN, ExceptionMessages.ONLY_OWNER_CAN_PERFORM_ACTION);
        }
    }
}
