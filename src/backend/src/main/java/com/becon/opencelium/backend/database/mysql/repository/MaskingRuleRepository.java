package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaskingRuleRepository extends JpaRepository<MaskingRule, Long> {
    @Query(value = "SELECT * FROM masking_rule WHERE connection_id = :connectionId", nativeQuery = true)
    List<MaskingRule> findRulesByConnectionId(@Param("connectionId") Long connectionId);

    @Query(value = "SELECT * FROM masking_rule WHERE connection_id = :connectionId AND id = :ruleId", nativeQuery = true)
    Optional<MaskingRule> findRuleByConnectionIdAndId(@Param("connectionId") Long connectionId, @Param("ruleId") Long ruleId);

    @Query(value = "SELECT EXISTS (SELECT 1 FROM masking_rule WHERE connection_id = :connectionId AND ruleId = :ruleId)", nativeQuery = true)
    boolean existsByConnectionIdAndId(@Param("connectionId") Long connectionId, @Param("ruleId") Long ruleId);

    @Modifying
    @Query(value = "DELETE FROM masking_rule WHERE connection_id = :connectionId", nativeQuery = true)
    void deleteByConnectionId(@Param("connectionId") Long connectionId);

    @Modifying
    @Query(value = "DELETE FROM masking_rule WHERE connection_id = :connectionId AND id = :ruleId", nativeQuery = true)
    void deleteByConnectionIdAndId(@Param("connectionId") Long connectionId, @Param("ruleId") Long ruleId);
}
