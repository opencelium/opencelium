package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByUserIdAndValidTrue(int userId);

    @Query(value = "SELECT * FROM password_reset_token WHERE user_id = :userId ORDER BY created_at DESC LIMIT :limit", nativeQuery = true)
    List<PasswordResetToken> findLatestTokensByUserId(@Param("userId") int userId, @Param("limit") int limit);

    Optional<PasswordResetToken> findByTokenAndValidTrue(String hashedToken);
}
