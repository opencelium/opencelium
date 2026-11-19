package com.becon.opencelium.backend.database.mysql.entity;

import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.persistence.Version;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

/**
 * A named value that users define once and that workflows, connectors and notifications read
 * through {@code {{global.name}}}.
 *
 * <p>The {@code value} column holds JSON text of any JSON type. {@code version} starts at 1 and
 * goes up by one on every saved change, including a change of the scope targets or the grants:
 * it guards the edit form against lost updates and numbers the entries of the change log.
 */
@Entity
@Table(name = "global_variable")
@EntityListeners(AuditingEntityListener.class)
public class GlobalVariable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", length = 64, nullable = false, unique = true)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "kind", length = 16, nullable = false, updatable = false)
    private GlobalVariableKind kind;

    @Column(name = "value", columnDefinition = "LONGTEXT")
    private String value;

    @Column(name = "description", length = 512)
    private String description;

    @Column(name = "secret", nullable = false)
    private boolean secret;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", length = 16, nullable = false)
    private GlobalVariableScopeType scopeType;

    @ElementCollection
    @CollectionTable(name = "global_variable_scope", joinColumns = @JoinColumn(name = "variable_id"))
    private Set<GlobalVariableScopeTarget> scopeTargets = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "global_variable_permission", joinColumns = @JoinColumn(name = "variable_id"))
    private Set<GlobalVariableGrant> grants = new HashSet<>();

    // the creator; null once that user is deleted, which leaves the variable to the admins
    @Column(name = "owner_user_id")
    private Integer ownerUserId;

    // primitive and preset, so the first saved version is 1 and Spring Data still tells a new
    // variable by its missing id
    @Version
    @Column(name = "version", nullable = false)
    private long version = 1;

    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", updatable = false)
    private Date createdAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private Integer createdBy;

    @UpdateTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt;

    @LastModifiedBy
    @Column(name = "updated_by")
    private Integer updatedBy;

    /**
     * Tells whether a workflow may use this variable.
     *
     * @param connectionId id of the workflow
     * @param categoryIds  the category of the workflow and every category above it, so a variable
     *                     scoped to a category also reaches the workflows of its subcategories;
     *                     empty for a workflow without a category
     */
    public boolean isInScopeOf(long connectionId, Set<Long> categoryIds) {
        return covers(scopeType, scopeTargets, connectionId, categoryIds);
    }

    /**
     * Tells whether a scope covers a workflow: the rule of {@link #isInScopeOf(long, Set)} for a
     * scope that is not saved yet.
     */
    public static boolean covers(GlobalVariableScopeType scopeType, Set<GlobalVariableScopeTarget> scopeTargets,
            long connectionId, Set<Long> categoryIds) {
        return switch (scopeType) {
            case ALL -> true;
            case CATEGORIES -> scopeTargets.stream()
                    .anyMatch(target -> target.getTargetType() == GlobalVariableScopeTarget.Type.CATEGORY
                            && categoryIds.contains(target.getTargetId()));
            case WORKFLOWS -> scopeTargets.contains(GlobalVariableScopeTarget.workflow(connectionId));
        };
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public GlobalVariableKind getKind() {
        return kind;
    }

    public void setKind(GlobalVariableKind kind) {
        this.kind = kind;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isSecret() {
        return secret;
    }

    public void setSecret(boolean secret) {
        this.secret = secret;
    }

    public GlobalVariableScopeType getScopeType() {
        return scopeType;
    }

    public void setScopeType(GlobalVariableScopeType scopeType) {
        this.scopeType = scopeType;
    }

    public Set<GlobalVariableScopeTarget> getScopeTargets() {
        return scopeTargets;
    }

    public void setScopeTargets(Set<GlobalVariableScopeTarget> scopeTargets) {
        this.scopeTargets = scopeTargets;
    }

    public Set<GlobalVariableGrant> getGrants() {
        return grants;
    }

    public void setGrants(Set<GlobalVariableGrant> grants) {
        this.grants = grants;
    }

    public Integer getOwnerUserId() {
        return ownerUserId;
    }

    public void setOwnerUserId(Integer ownerUserId) {
        this.ownerUserId = ownerUserId;
    }

    public long getVersion() {
        return version;
    }

    public void setVersion(long version) {
        this.version = version;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Integer createdBy) {
        this.createdBy = createdBy;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Integer getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(Integer updatedBy) {
        this.updatedBy = updatedBy;
    }
}
