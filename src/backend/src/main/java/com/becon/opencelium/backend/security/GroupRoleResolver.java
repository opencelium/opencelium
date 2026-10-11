package com.becon.opencelium.backend.security;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Resolves the OpenCelium role of a user authenticated by an external system (LDAP, OIDC) from the
 * configured group to role mapping.
 */
public final class GroupRoleResolver {

    private GroupRoleResolver() {
    }

    /**
     * Walks the mapping in its configured order and returns the role of the first mapped group the
     * user is a member of. The order in which the external system reports the user's groups is not
     * stable - Entra ID does not guarantee one - so iterating those groups instead would let the
     * role of a user who is a member of several mapped groups change between logins.
     *
     * @param source       name of the authenticator used in the log messages, for example "LDAP"
     * @param mappedGroups groups of the mapping, in configured order
     * @param userGroups   groups the authenticated user is a member of
     * @param roleByGroup  role configured for a mapped group, empty when it has none
     * @param defaultRole  role used when no mapped group matches
     * @param log          receives the per-group diagnostic messages
     */
    public static String resolveRole(String source, List<String> mappedGroups, Collection<String> userGroups,
                                     Function<String, Optional<String>> roleByGroup, String defaultRole,
                                     Consumer<String> log) {
        String mappings = mappedGroups.stream().collect(Collectors.joining("; ", "[", "]"));

        for (String mappedGroup : mappedGroups) {
            if (userGroups.contains(mappedGroup)) {
                log.accept("Match found for " + source + " group = '" + mappedGroup + "'");

                // A mapped group without a role is a mistake in the configuration; the default role keeps
                // the login working instead of failing with a NoSuchElementException.
                return roleByGroup.apply(mappedGroup).orElse(defaultRole);
            }

            log.accept("No match found for " + source + " group = '" + mappedGroup + "' in OC mappings " + mappings);
        }

        return defaultRole;
    }
}
