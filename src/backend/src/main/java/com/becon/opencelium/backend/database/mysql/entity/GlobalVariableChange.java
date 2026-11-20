package com.becon.opencelium.backend.database.mysql.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;

import java.util.Date;
import java.util.Objects;

/**
 * One entry of the change log of a {@link GlobalVariable}, written in the transaction of the
 * change itself.
 *
 * <p>The entry copies the id and the name of the variable instead of referencing it, so the
 * history survives the variable. For a {@link Type#CONFIG} or {@link Type#PERMISSIONS} change,
 * {@code oldValue} and {@code newValue} hold the changed fields as JSON; for the other types
 * they hold the value of the variable, or {@link #SECRET_MASK} in place of the value of a secret.
 */
@Entity
@Table(name = "global_variable_change")
public class GlobalVariableChange {

    /**
     * Stored in place of the value of a secret, neither the plain nor the encrypted text. It is
     * not valid JSON, so no value the API saves can be equal to it.
     */
    public static final String SECRET_MASK = "••••";

    /** What was changed. */
    public enum Type {
        CREATE, VALUE, CONFIG, PERMISSIONS, RESTORE, DELETE,
        /** The current value of a mutable variable was set back to its initial value. */
        RESET
    }

    /** Who made the change. */
    public enum ActorType {
        USER, WORKFLOW
    }

    /** Whether the change was saved. */
    public enum Result {
        SAVED, REJECTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "variable_id", nullable = false, updatable = false)
    private Long variableId;

    @Column(name = "variable_name", length = 64, nullable = false, updatable = false)
    private String variableName;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", length = 16, nullable = false, updatable = false)
    private Type changeType;

    @Column(name = "version_from", updatable = false)
    private Long versionFrom;

    @Column(name = "version_to", updatable = false)
    private Long versionTo;

    @Column(name = "old_value", columnDefinition = "LONGTEXT", updatable = false)
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "LONGTEXT", updatable = false)
    private String newValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_type", length = 16, nullable = false, updatable = false)
    private ActorType actorType;

    @Column(name = "user_id", updatable = false)
    private Integer userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", length = 16, nullable = false, updatable = false)
    private Result result;

    @Column(name = "reason", length = 512, updatable = false)
    private String reason;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "changed_at", nullable = false, updatable = false)
    private Date changedAt;

    protected GlobalVariableChange() {
    }

    /**
     * Creates the entry of a change a user saved.
     *
     * @param variable    the changed variable; its id and name are copied
     * @param changeType  what was changed
     * @param versionFrom version before the change, {@code null} for {@link Type#CREATE}
     * @param versionTo   version after the change, {@code null} for {@link Type#DELETE}
     * @param oldValue    value or changed fields before the change, may be {@code null}
     * @param newValue    value or changed fields after the change, may be {@code null}
     * @param userId      the user who saved the change, {@code null} if unknown
     */
    public static GlobalVariableChange savedByUser(GlobalVariable variable, Type changeType,
            Long versionFrom, Long versionTo, String oldValue, String newValue, Integer userId) {
        GlobalVariableChange change = new GlobalVariableChange();
        change.variableId = Objects.requireNonNull(variable.getId(), "variable id");
        change.variableName = variable.getName();
        change.changeType = Objects.requireNonNull(changeType, "changeType");
        change.versionFrom = versionFrom;
        change.versionTo = versionTo;
        change.oldValue = oldValue;
        change.newValue = newValue;
        change.actorType = ActorType.USER;
        change.userId = userId;
        change.result = Result.SAVED;
        change.changedAt = new Date();

        return change;
    }

    public Long getId() {
        return id;
    }

    public Long getVariableId() {
        return variableId;
    }

    public String getVariableName() {
        return variableName;
    }

    public Type getChangeType() {
        return changeType;
    }

    public Long getVersionFrom() {
        return versionFrom;
    }

    public Long getVersionTo() {
        return versionTo;
    }

    public String getOldValue() {
        return oldValue;
    }

    public String getNewValue() {
        return newValue;
    }

    public ActorType getActorType() {
        return actorType;
    }

    public Integer getUserId() {
        return userId;
    }

    public Result getResult() {
        return result;
    }

    public String getReason() {
        return reason;
    }

    public Date getChangedAt() {
        return changedAt;
    }
}
