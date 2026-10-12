package com.becon.opencelium.backend.security;

import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Read-access policy for system settings, referenced by name from the {@code @PreAuthorize}
 * expression on {@code SystemSettingController#get}. Settings are admin-only by default; a setting
 * every authenticated user may read (e.g. UI branding that each client must apply) has to be
 * whitelisted here explicitly. Keeping the policy in code is deliberate: settings are introduced
 * by code changes anyway, so their read classification rides the same pull request and a forgotten
 * classification fails closed.
 */
@Component("systemSettingSecurity")
public class SystemSettingSecurity {

    private static final Set<String> USER_READABLE = Set.of("theme_colors", "app_logo");

    public boolean isUserReadable(String name) {
        return name != null && USER_READABLE.contains(name);
    }
}
