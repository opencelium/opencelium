package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableChange;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GlobalVariableChangeRepository extends JpaRepository<GlobalVariableChange, Long> {

    /** Returns the change log of a variable, newest entry first. */
    Page<GlobalVariableChange> findByVariableIdOrderByChangedAtDescIdDesc(Long variableId, Pageable pageable);

    /**
     * Overwrites the values the change log holds for a variable with {@code mask}: every value of
     * a creation, a value change, a restore and a deletion. A side that holds no value stays
     * empty, and the changed fields of a CONFIG or PERMISSIONS entry stay as they are. Native,
     * because the columns cannot be changed through the entity.
     *
     * @return the number of entries that were overwritten
     */
    @Modifying
    @Query(value = """
            UPDATE global_variable_change
               SET old_value = CASE WHEN old_value IS NULL THEN old_value ELSE :mask END,
                   new_value = CASE WHEN new_value IS NULL THEN new_value ELSE :mask END
             WHERE variable_id = :variableId
               AND change_type IN ('CREATE', 'VALUE', 'RESTORE', 'DELETE')
            """, nativeQuery = true)
    int maskValues(@Param("variableId") long variableId, @Param("mask") String mask);
}
