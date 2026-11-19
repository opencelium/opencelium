package com.becon.opencelium.backend.unit.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableGrant;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import com.becon.opencelium.backend.database.mysql.repository.RoleHasPermissionRepository;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;
import com.becon.opencelium.backend.security.GlobalVariableSecurity;
import com.becon.opencelium.backend.security.GlobalVariableSecurity.Caller;
import com.becon.opencelium.backend.security.UserPrincipals;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.becon.opencelium.backend.testutil.fixture.UserFixture;
import com.becon.opencelium.backend.testutil.fixture.UserRoleFixture;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Unit tests for {@link GlobalVariableSecurity}: the component permission of the role and the
 * permissions on a single variable.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalVariableSecurityTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("GlobalVariableSecurity — unit")
class GlobalVariableSecurityTest {

    private static final int OWNER_ID = 1;
    private static final int OTHER_ID = 7;
    private static final int ROLE_ID = 3;

    @Mock
    RoleHasPermissionRepository roleHasPermissionRepository;

    @InjectMocks
    GlobalVariableSecurity security;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // ── permissionsOn ─────────────────────────────────────────────────────────

    @Test
    void permissionsOnReturnsAllWhenCallerIsOwner() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");

        Set<GlobalVariablePermission> permissions = security.permissionsOn(variable, new Caller(OWNER_ID, false));

        assertThat(permissions).containsExactlyInAnyOrder(GlobalVariablePermission.values());
    }

    @Test
    void permissionsOnReturnsAllWhenCallerIsAdmin() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");

        Set<GlobalVariablePermission> permissions = security.permissionsOn(variable, new Caller(OTHER_ID, true));

        assertThat(permissions).containsExactlyInAnyOrder(GlobalVariablePermission.values());
    }

    @Test
    @DisplayName("permissionsOn — EDIT includes VIEW_USE but not DELETE")
    void permissionsOnAddsViewUseWhenOnlyEditIsGranted() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        variable.getGrants().add(new GlobalVariableGrant(OTHER_ID, GlobalVariablePermission.EDIT));

        Set<GlobalVariablePermission> permissions = security.permissionsOn(variable, new Caller(OTHER_ID, false));

        assertThat(permissions)
                .containsExactlyInAnyOrder(GlobalVariablePermission.VIEW_USE, GlobalVariablePermission.EDIT);
    }

    @Test
    @DisplayName("permissionsOn — a grant of another user gives the caller nothing")
    void permissionsOnReturnsNothingWhenCallerHasNoGrant() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        variable.getGrants().add(new GlobalVariableGrant(99, GlobalVariablePermission.DELETE));

        Set<GlobalVariablePermission> permissions = security.permissionsOn(variable, new Caller(OTHER_ID, false));

        assertThat(permissions).isEmpty();
    }

    // ── canManageGrants ───────────────────────────────────────────────────────

    @Test
    void canManageGrantsReturnsFalseWhenCallerOnlyHasEdit() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        variable.getGrants().add(new GlobalVariableGrant(OTHER_ID, GlobalVariablePermission.EDIT));

        boolean result = security.canManageGrants(variable, new Caller(OTHER_ID, false));

        assertThat(result).isFalse();
    }

    @Test
    void canManageGrantsReturnsTrueWhenCallerIsOwner() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");

        boolean result = security.canManageGrants(variable, new Caller(OWNER_ID, false));

        assertThat(result).isTrue();
    }

    // ── can ───────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("can — an admin needs no role permission, so none is looked up")
    void canReturnsTrueWhenCallerIsAdmin() {
        authenticate(aUserWithRole("Admin"));

        boolean result = security.can("DELETE");

        assertThat(result).isTrue();
        verifyNoInteractions(roleHasPermissionRepository);
    }

    @Test
    void canReturnsTrueWhenRoleHoldsPermission() {
        authenticate(aUserWithRole("User"));
        when(roleHasPermissionRepository.existsByRoleAndNames(ROLE_ID, "GLOBAL_VARIABLE", "READ"))
                .thenReturn(true);

        boolean result = security.can("READ");

        assertThat(result).isTrue();
    }

    @Test
    void canReturnsFalseWhenRoleLacksPermission() {
        authenticate(aUserWithRole("User"));
        when(roleHasPermissionRepository.existsByRoleAndNames(ROLE_ID, "GLOBAL_VARIABLE", "CREATE"))
                .thenReturn(false);

        boolean result = security.can("CREATE");

        assertThat(result).isFalse();
    }

    @Test
    void canReturnsFalseWhenNoUserIsAuthenticated() {
        boolean result = security.can("READ");

        assertThat(result).isFalse();
        verifyNoInteractions(roleHasPermissionRepository);
    }

    // ── caller ────────────────────────────────────────────────────────────────

    @Test
    void callerReturnsUserIdAndAdminFlagWhenUserIsAuthenticated() {
        authenticate(aUserWithRole("Admin"));

        assertThat(security.caller()).contains(new Caller(OTHER_ID, true));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static User aUserWithRole(String roleName) {
        UserRole role = UserRoleFixture.aNewRole(roleName, roleName + " role");
        role.setId(ROLE_ID);

        User user = UserFixture.anEmptyUser();
        user.setId(OTHER_ID);
        user.setUserRole(role);
        return user;
    }

    private static void authenticate(User user) {
        UserPrincipals principals = new UserPrincipals(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principals, null, principals.getAuthorities()));
    }
}
