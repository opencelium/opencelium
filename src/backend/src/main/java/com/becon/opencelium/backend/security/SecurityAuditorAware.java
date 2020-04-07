package com.becon.opencelium.backend.security;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class SecurityAuditorAware implements AuditorAware<Integer> {

    @Override
    public Optional<Integer> getCurrentAuditor() {
        UserPrincipals userPrincipals = (UserPrincipals) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return Optional.of(userPrincipals.getUser().getId());
    }
}
