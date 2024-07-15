package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.SecretKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SecretKeyRepository extends JpaRepository<SecretKey, String> {
    @Query(value = "select * from secret_key_for_encoder limit 1", nativeQuery = true)
    Optional<SecretKey> getSecretKey();
}
