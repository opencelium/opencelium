package com.becon.opencelium.backend.slice.database.mysql.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.database.mysql.entity.Component;
import com.becon.opencelium.backend.database.mysql.entity.Permission;
import com.becon.opencelium.backend.database.mysql.entity.RoleHasPermission;
import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import com.becon.opencelium.backend.database.mysql.repository.RoleHasPermissionRepository;
import com.becon.opencelium.backend.testutil.annotation.SliceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

/**
 * JPA slice test for {@link RoleHasPermissionRepository#existsByRoleAndNames}: the query behind
 * the component permission check of global variables. It joins the role's rows to the component
 * and the permission by name, which only a SQL engine can prove right.
 *
 * Run with: ./gradlew test --tests "*.RoleHasPermissionRepositoryTest"
 */
@SliceTest
@DisplayName("RoleHasPermissionRepository — JPA slice")
class RoleHasPermissionRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private RoleHasPermissionRepository repository;

    private UserRole editors;
    private UserRole viewers;

    @BeforeEach
    void seedRolePermissions() {
        editors = persistedRole("Editors");
        viewers = persistedRole("Viewers");
        Component globalVariable = persistedComponent("GLOBAL_VARIABLE");
        Component connection = persistedComponent("CONNECTION");
        Permission read = persistedPermission("READ");
        Permission update = persistedPermission("UPDATE");

        em.persist(new RoleHasPermission(editors, globalVariable, read));
        em.persist(new RoleHasPermission(editors, globalVariable, update));
        em.persist(new RoleHasPermission(viewers, globalVariable, read));
        em.persist(new RoleHasPermission(viewers, connection, update));
        em.flush();
        em.clear();
    }

    @Test
    void existsByRoleAndNamesReturnsTrueWhenRoleHoldsPermission() {
        boolean result = repository.existsByRoleAndNames(editors.getId(), "GLOBAL_VARIABLE", "UPDATE");

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("exists — the permission of another role on the component does not count")
    void existsByRoleAndNamesReturnsFalseWhenOnlyAnotherRoleHoldsPermission() {
        boolean result = repository.existsByRoleAndNames(viewers.getId(), "GLOBAL_VARIABLE", "UPDATE");

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("exists — the same permission on another component does not count")
    void existsByRoleAndNamesReturnsFalseWhenPermissionIsOnAnotherComponent() {
        boolean result = repository.existsByRoleAndNames(editors.getId(), "CONNECTION", "UPDATE");

        assertThat(result).isFalse();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private UserRole persistedRole(String name) {
        UserRole role = new UserRole();
        role.setName(name);
        role.setDescription(name + " description");
        return em.persistAndFlush(role);
    }

    private Component persistedComponent(String name) {
        Component component = new Component();
        component.setName(name);
        component.setDescription(name + " description");
        return em.persistAndFlush(component);
    }

    private Permission persistedPermission(String name) {
        Permission permission = new Permission();
        permission.setName(name);
        permission.setDescription(name + " description");
        return em.persistAndFlush(permission);
    }
}
