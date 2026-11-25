package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Date;
import java.util.List;

@Repository
public interface GlobalVariableRepository extends JpaRepository<GlobalVariable, Long> {

    /**
     * Loads the variables a user may use, together with their scope targets, in one query. A
     * user may use what they own and what they were granted: every grant includes VIEW_USE.
     *
     * @param userId the user, or {@code null} for the variables of every user
     */
    @Query("SELECT DISTINCT v FROM GlobalVariable v LEFT JOIN FETCH v.scopeTargets LEFT JOIN v.grants g"
            + " WHERE :userId IS NULL OR v.ownerUserId = :userId OR g.userId = :userId")
    List<GlobalVariable> findUsableWithScopeTargets(@Param("userId") Integer userId);

    /**
     * Finds the variables with these ids that a user may view, in one query.
     *
     * @param userId the user, or {@code null} for the variables of every user
     */
    @Query("SELECT DISTINCT v FROM GlobalVariable v LEFT JOIN v.grants g"
            + " WHERE v.id IN :ids AND (:userId IS NULL OR v.ownerUserId = :userId OR g.userId = :userId)")
    List<GlobalVariable> findViewableByIds(@Param("ids") Collection<Long> ids, @Param("userId") Integer userId);

    /** Names are unique whatever their case, as the unique key of the table is. */
    boolean existsByNameIgnoreCase(String name);

    /** Finds the variables with exactly these names, as references spell them. */
    List<GlobalVariable> findByNameIn(Collection<String> names);

    /**
     * Loads every variable of the given kinds together with its scope targets, in one query.
     * Used to take the snapshot of a run, which then needs no further read.
     */
    @Query("SELECT DISTINCT v FROM GlobalVariable v LEFT JOIN FETCH v.scopeTargets WHERE v.kind IN :kinds")
    List<GlobalVariable> findAllWithScopeTargets(@Param("kinds") Collection<GlobalVariableKind> kinds);

    /**
     * Finds the mutable variables a workflow uses: the ones it is an owner of, which its runs
     * write, and the ones an element of the workflow references, as the where-used index records
     * them. Such a workflow runs one execution at a time.
     *
     * @param connectionId id of the workflow
     */
    default List<GlobalVariable> findMutableUsedByWorkflow(long connectionId) {
        return findMutableUsedBySource(connectionId, GlobalVariableUsage.SourceType.WORKFLOW);
    }

    @Query("""
            SELECT v FROM GlobalVariable v
             WHERE v.kind = com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind.MUTABLE
               AND (v.id IN (SELECT o.id FROM GlobalVariable o JOIN o.ownerWorkflowIds ownerId
                              WHERE ownerId = :connectionId)
                    OR v.id IN (SELECT u.variableId FROM GlobalVariableUsage u
                                 WHERE u.sourceType = :workflow AND u.sourceId = :connectionId))
             ORDER BY v.name
            """)
    List<GlobalVariable> findMutableUsedBySource(@Param("connectionId") long connectionId,
            @Param("workflow") GlobalVariableUsage.SourceType workflow);

    /**
     * Finds the variables a user may view, filtered by kind and by a text in the name or the
     * description.
     *
     * @param kind    kind to keep, or {@code null} for every kind
     * @param pattern lower-case LIKE pattern with {@code !} as the escape character, or
     *                {@code null} for no text filter
     * @param userId  the user who must own the variable or hold a grant on it, or {@code null}
     *                to find the variables of every user
     */
    @Query(value = """
            SELECT DISTINCT v FROM GlobalVariable v LEFT JOIN v.grants g
             WHERE (:kind IS NULL OR v.kind = :kind)
               AND (:pattern IS NULL
                    OR LOWER(v.name) LIKE :pattern ESCAPE '!'
                    OR LOWER(v.description) LIKE :pattern ESCAPE '!')
               AND (:userId IS NULL OR v.ownerUserId = :userId OR g.userId = :userId)
            """,
            countQuery = """
            SELECT COUNT(DISTINCT v) FROM GlobalVariable v LEFT JOIN v.grants g
             WHERE (:kind IS NULL OR v.kind = :kind)
               AND (:pattern IS NULL
                    OR LOWER(v.name) LIKE :pattern ESCAPE '!'
                    OR LOWER(v.description) LIKE :pattern ESCAPE '!')
               AND (:userId IS NULL OR v.ownerUserId = :userId OR g.userId = :userId)
            """)
    Page<GlobalVariable> search(@Param("kind") GlobalVariableKind kind,
                                @Param("pattern") String pattern,
                                @Param("userId") Integer userId,
                                Pageable pageable);

    /**
     * Sets the current value of a mutable variable back to its initial value in one statement,
     * so it cannot interleave with a write of a run. The version stays as it is: a reset changes
     * no part of the definition.
     *
     * @param setAt  when the reset happened
     * @param userId the user who reset the value
     * @return 1 if the variable was reset, 0 if it does not exist or is not mutable
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            UPDATE GlobalVariable v
               SET v.currentValue = v.value,
                   v.currentRevision = v.currentRevision + 1,
                   v.currentSetAt = :setAt,
                   v.currentSetByUser = :userId,
                   v.currentSetByExecution = NULL
             WHERE v.id = :id AND v.kind = com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind.MUTABLE
            """)
    int resetCurrentValue(@Param("id") long id, @Param("setAt") Date setAt, @Param("userId") Integer userId);

    /**
     * Gives a mutable variable a new current value in one statement, written by a run. The
     * version stays as it is: a run changes no part of the definition.
     *
     * @param value       the new value as JSON text
     * @param setAt       when the run wrote it
     * @param executionId the execution that wrote it
     * @return 1 if the value was written, 0 if the variable does not exist or is not mutable
     */
    @Transactional
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            UPDATE GlobalVariable v
               SET v.currentValue = :value,
                   v.currentRevision = v.currentRevision + 1,
                   v.currentSetAt = :setAt,
                   v.currentSetByUser = NULL,
                   v.currentSetByExecution = :executionId
             WHERE v.id = :id AND v.kind = com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind.MUTABLE
            """)
    int writeCurrentValue(@Param("id") long id, @Param("value") String value, @Param("setAt") Date setAt,
            @Param("executionId") long executionId);
}
