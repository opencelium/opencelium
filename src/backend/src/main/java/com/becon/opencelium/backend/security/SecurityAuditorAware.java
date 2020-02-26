package com.becon.opencelium.backend.security;

import com.becon.opencelium.backend.exception.EmailNotFoundException;
import com.becon.opencelium.backend.exception.UserNotFoundException;
import com.becon.opencelium.backend.mysql.entity.User;
import com.becon.opencelium.backend.mysql.service.UserServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class SecurityAuditorAware implements AuditorAware<Integer> {

    @Autowired
    private UserServiceImpl userService;

    @Override
    public Optional<Integer> getCurrentAuditor() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userService.findByEmail(email).orElseThrow(() -> new EmailNotFoundException(email));
        return Optional.of(user.getId());
    }
}
