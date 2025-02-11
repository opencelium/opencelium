package com.becon.opencelium.backend.security;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.Optional;

@Component
public class SecurityAuditorAware implements AuditorAware<Integer> {

    @Override
    public Optional<Integer> getCurrentAuditor() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        UserPrincipals userPrincipals = null;
        if (Objects.nonNull(securityContext.getAuthentication())) {
            userPrincipals = (UserPrincipals) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();

        }
        return Optional.of(Objects.isNull(userPrincipals) ? -1 : userPrincipals.getUser().getId());
    }
}
