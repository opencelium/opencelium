package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    /**
     * Returns the user's valid token. A user has at most one: a new token is only issued once
     * the previous one has been invalidated.
     */
    Optional<PasswordResetToken> findByUserIdAndValidTrue(int userId);

    /** The user's latest self-service tokens, newest first; admin links are left out. */
    @Query(value = "SELECT * FROM password_reset_token WHERE user_id = :userId AND purpose = 'SELF_SERVICE' "
            + "ORDER BY created_at DESC LIMIT :limit", nativeQuery = true)
    List<PasswordResetToken> findLatestSelfServiceTokensByUserId(@Param("userId") int userId, @Param("limit") int limit);

    Optional<PasswordResetToken> findByTokenAndValidTrue(String hashedToken);

    /** Invalidates every valid token of the user and returns how many there were. */
    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.valid = false WHERE t.user.id = :userId AND t.valid = true")
    int invalidateValidTokensByUserId(@Param("userId") int userId);

    /**
     * Marks the token used and invalid, provided it is still valid, and returns whether it was.
     * The check and the update are one statement, so of two requests racing with the same token
     * only one gets {@code 1}.
     */
    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.valid = false, t.used = true WHERE t.token = :token AND t.valid = true")
    int consumeValidToken(@Param("token") String hashedToken);

    /** Removes all tokens of the user, which must happen before the user row is deleted. */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.user.id = :userId")
    void deleteAllByUserId(@Param("userId") int userId);
}
