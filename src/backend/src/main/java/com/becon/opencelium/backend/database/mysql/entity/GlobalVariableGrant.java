package com.becon.opencelium.backend.database.mysql.entity;

import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.util.Objects;

/**
 * One permission the owner of a {@link GlobalVariable} granted to another user. A row of
 * {@code global_variable_permission}.
 */
@Embeddable
public class GlobalVariableGrant {

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "permission", length = 16, nullable = false)
    private GlobalVariablePermission permission;

    protected GlobalVariableGrant() {
    }

    public GlobalVariableGrant(Integer userId, GlobalVariablePermission permission) {
        this.userId = Objects.requireNonNull(userId, "userId");
        this.permission = Objects.requireNonNull(permission, "permission");
    }

    public Integer getUserId() {
        return userId;
    }

    public GlobalVariablePermission getPermission() {
        return permission;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof GlobalVariableGrant other)) {
            return false;
        }

        return Objects.equals(userId, other.userId) && permission == other.permission;
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, permission);
    }
}
