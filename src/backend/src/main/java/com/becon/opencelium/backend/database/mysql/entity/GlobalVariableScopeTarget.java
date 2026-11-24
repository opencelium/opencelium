package com.becon.opencelium.backend.database.mysql.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.util.Objects;

/**
 * One category or workflow that may use a {@link GlobalVariable} whose scope is not every
 * workflow. A row of {@code global_variable_scope}.
 */
@Embeddable
public class GlobalVariableScopeTarget {

    /** What {@link #getTargetId()} identifies. */
    public enum Type {
        /** A category; its subcategories are in scope too. */
        CATEGORY,
        /** A workflow, stored as a connection. */
        WORKFLOW
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", length = 16, nullable = false)
    private Type targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    protected GlobalVariableScopeTarget() {
    }

    private GlobalVariableScopeTarget(Type targetType, Long targetId) {
        this.targetType = Objects.requireNonNull(targetType, "targetType");
        this.targetId = Objects.requireNonNull(targetId, "targetId");
    }

    public static GlobalVariableScopeTarget category(long categoryId) {
        return new GlobalVariableScopeTarget(Type.CATEGORY, categoryId);
    }

    public static GlobalVariableScopeTarget workflow(long connectionId) {
        return new GlobalVariableScopeTarget(Type.WORKFLOW, connectionId);
    }

    public Type getTargetType() {
        return targetType;
    }

    public Long getTargetId() {
        return targetId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof GlobalVariableScopeTarget other)) {
            return false;
        }

        return targetType == other.targetType && Objects.equals(targetId, other.targetId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(targetType, targetId);
    }
}
