package com.becon.opencelium.backend.security;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableGrant;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.repository.RoleHasPermissionRepository;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Access policy of global variables, in two layers.
 *
 * <p>The {@code GLOBAL_VARIABLE} component permission of the user's role opens the endpoints; it
 * is referenced by name from the {@code @PreAuthorize} expressions on {@code
 * GlobalVariableController}. The permissions on a single variable then decide what the user may
 * do with it: the owner user and admins hold all of them, other users hold what the owner
 * granted.
 */
@Component("globalVariableSecurity")
public class GlobalVariableSecurity {

    public static final String COMPONENT = "GLOBAL_VARIABLE";

    private static final String ADMIN_ROLE = "Admin";

    private final RoleHasPermissionRepository roleHasPermissionRepository;

    public GlobalVariableSecurity(RoleHasPermissionRepository roleHasPermissionRepository) {
        this.roleHasPermissionRepository = roleHasPermissionRepository;
    }

    /**
     * The authenticated user as far as this policy needs it.
     *
     * @param userId id of the user
     * @param admin  whether the user has the admin role
     */
    public record Caller(int userId, boolean admin) {
    }

    /** Returns the authenticated user, or empty when the request carries none. */
    public Optional<Caller> caller() {
        return currentUser().map(user -> new Caller(user.getId(), isAdmin(user)));
    }

    /**
     * Tells whether the role of the authenticated user holds a permission on the {@code
     * GLOBAL_VARIABLE} component.
     *
     * @param permission {@code READ}, {@code CREATE}, {@code UPDATE} or {@code DELETE}
     */
    public boolean can(String permission) {
        Optional<User> user = currentUser();
        if (user.isEmpty()) {
            return false;
        }
        if (isAdmin(user.get())) {
            return true;
        }

        return roleHasPermissionRepository.existsByRoleAndNames(
                user.get().getUserRole().getId(), COMPONENT, permission);
    }

    /**
     * Returns what {@code caller} may do with {@code variable}: everything for the owner user
     * and for admins, otherwise the granted permissions and the ones they include.
     */
    public Set<GlobalVariablePermission> permissionsOn(GlobalVariable variable, Caller caller) {
        if (caller.admin() || isOwner(variable, caller)) {
            return EnumSet.allOf(GlobalVariablePermission.class);
        }

        Set<GlobalVariablePermission> granted = variable.getGrants().stream()
                .filter(grant -> grant.getUserId() == caller.userId())
                .map(GlobalVariableGrant::getPermission)
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(GlobalVariablePermission.class)));

        return GlobalVariablePermission.withIncluded(granted);
    }

    /** Tells whether {@code caller} may manage the grants of {@code variable}. */
    public boolean canManageGrants(GlobalVariable variable, Caller caller) {
        return caller.admin() || isOwner(variable, caller);
    }

    private static boolean isOwner(GlobalVariable variable, Caller caller) {
        return variable.getOwnerUserId() != null && variable.getOwnerUserId() == caller.userId();
    }

    private static boolean isAdmin(User user) {
        return user.getUserRole() != null && ADMIN_ROLE.equals(user.getUserRole().getName());
    }

    private static Optional<User> currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipals principals)) {
            return Optional.empty();
        }

        return Optional.ofNullable(principals.getUser());
    }
}
