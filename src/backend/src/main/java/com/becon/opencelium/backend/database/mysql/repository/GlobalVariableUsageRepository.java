package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Set;

@Repository
public interface GlobalVariableUsageRepository extends JpaRepository<GlobalVariableUsage, Long> {

    /** Returns the usages of a variable, grouped by source and ordered by element. */
    List<GlobalVariableUsage> findByVariableIdOrderBySourceTypeAscSourceIdAscElementRefAscIdAsc(Long variableId);

    boolean existsByVariableId(Long variableId);

    /**
     * Returns the variables some sources of one type use as they are stored, each once.
     *
     * @param sourceIds the sources; not empty
     * @return the ids of the variables; empty if the sources use none or do not exist
     */
    @Query("SELECT DISTINCT u.variableId FROM GlobalVariableUsage u"
            + " WHERE u.sourceType = :sourceType AND u.sourceId IN :sourceIds")
    Set<Long> findVariableIdsBySources(@Param("sourceType") GlobalVariableUsage.SourceType sourceType,
                                       @Param("sourceIds") Collection<Long> sourceIds);

    /**
     * Counts the usages of several variables at once.
     *
     * @return one row per variable that is used: its id and the number of its usages
     */
    @Query("SELECT u.variableId, COUNT(u) FROM GlobalVariableUsage u WHERE u.variableId IN :variableIds"
            + " GROUP BY u.variableId")
    List<Object[]> countByVariableIds(@Param("variableIds") Collection<Long> variableIds);

    /** Removes every usage a source holds, before its usages are written anew or when it is deleted. */
    @Modifying
    @Query("DELETE FROM GlobalVariableUsage u WHERE u.sourceType = :sourceType AND u.sourceId = :sourceId")
    void deleteBySource(@Param("sourceType") GlobalVariableUsage.SourceType sourceType,
                        @Param("sourceId") Long sourceId);

    /**
     * Removes the usages some fields of a source hold, before the usages of those fields are
     * written anew. The usages of its other fields stay.
     */
    @Modifying
    @Query("DELETE FROM GlobalVariableUsage u WHERE u.sourceType = :sourceType AND u.sourceId = :sourceId"
            + " AND u.field IN :fields")
    void deleteBySourceAndFields(@Param("sourceType") GlobalVariableUsage.SourceType sourceType,
                                 @Param("sourceId") Long sourceId,
                                 @Param("fields") Collection<String> fields);

    /**
     * Removes the usages of workflows, connectors and notifications that no longer exist. A
     * source can leave by a path that does not clear its usages, for example a notification
     * that is deleted with its schedule, and such a row must not keep a variable from being
     * deleted.
     *
     * @return number of removed rows
     */
    default int deleteUsagesOfMissingSources() {
        return deleteUsagesOfMissingWorkflows()
                + deleteUsagesWithoutConnector(GlobalVariableUsage.SourceType.CONNECTOR)
                + deleteUsagesWithoutNotification(GlobalVariableUsage.SourceType.NOTIFICATION);
    }

    /**
     * Removes the usages of workflows that no longer exist.
     *
     * @return number of removed rows
     */
    default int deleteUsagesOfMissingWorkflows() {
        return deleteUsagesWithoutConnection(GlobalVariableUsage.SourceType.WORKFLOW);
    }

    @Modifying
    @Query("DELETE FROM GlobalVariableUsage u WHERE u.sourceType = :workflow"
            + " AND u.sourceId NOT IN (SELECT c.id FROM Connection c)")
    int deleteUsagesWithoutConnection(@Param("workflow") GlobalVariableUsage.SourceType workflow);

    @Modifying
    @Query("DELETE FROM GlobalVariableUsage u WHERE u.sourceType = :connector"
            + " AND u.sourceId NOT IN (SELECT c.id FROM Connector c)")
    int deleteUsagesWithoutConnector(@Param("connector") GlobalVariableUsage.SourceType connector);

    @Modifying
    @Query("DELETE FROM GlobalVariableUsage u WHERE u.sourceType = :notification"
            + " AND u.sourceId NOT IN (SELECT n.id FROM EventNotification n)")
    int deleteUsagesWithoutNotification(@Param("notification") GlobalVariableUsage.SourceType notification);
}
