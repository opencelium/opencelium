package com.becon.opencelium.backend.unit.security;

import static com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission.DELETE;
import static com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission.EDIT;
import static com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission.VIEW_USE;
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
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
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

    // ── grant matrix ──────────────────────────────────────────────────────────

    @ParameterizedTest(name = "[{index}] granted {0} → {1}, manages grants: {2}")
    @MethodSource("grantMatrix")
    @DisplayName("permissionsOn — each set of grants gives itself plus Use; only owner and admin manage grants")
    void permissionsOnGivesGrantedAndIncludedWhenCallerIsNeitherOwnerNorAdmin(
            Set<GlobalVariablePermission> granted, Set<GlobalVariablePermission> expected, boolean managesGrants) {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        granted.forEach(permission -> variable.getGrants().add(new GlobalVariableGrant(OTHER_ID, permission)));
        Caller caller = new Caller(OTHER_ID, false);

        assertThat(security.permissionsOn(variable, caller)).containsExactlyInAnyOrderElementsOf(expected);
        assertThat(security.canManageGrants(variable, caller)).isEqualTo(managesGrants);
    }

    static Stream<Arguments> grantMatrix() {
        return Stream.of(
                Arguments.of(Set.of(), Set.of(), false),
                Arguments.of(Set.of(VIEW_USE), Set.of(VIEW_USE), false),
                Arguments.of(Set.of(EDIT), Set.of(VIEW_USE, EDIT), false),
                Arguments.of(Set.of(DELETE), Set.of(VIEW_USE, DELETE), false),
                Arguments.of(Set.of(EDIT, DELETE), Set.of(VIEW_USE, EDIT, DELETE), false),
                Arguments.of(Set.of(VIEW_USE, EDIT, DELETE), Set.of(VIEW_USE, EDIT, DELETE), false));
    }

    @ParameterizedTest(name = "[{index}] admin {0}")
    @ValueSource(booleans = {true, false})
    @DisplayName("permissionsOn — the owner and an admin may do everything and manage grants, with no grant at all")
    void permissionsOnReturnsAllAndManagesGrantsWhenCallerIsOwnerOrAdmin(boolean admin) {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        Caller caller = admin ? new Caller(OTHER_ID, true) : new Caller(OWNER_ID, false);

        assertThat(security.permissionsOn(variable, caller)).containsExactlyInAnyOrder(VIEW_USE, EDIT, DELETE);
        assertThat(security.canManageGrants(variable, caller)).isTrue();
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
