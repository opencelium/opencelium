package com.becon.opencelium.backend.database.mongodb.repository;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectionMngRepository extends MongoRepository<ConnectionMng,String> {
    Optional<ConnectionMng> findByConnectionId(Long connectionId);
    @Query(value="{'_id' : ?1}", delete = true)
    void deleteById(String id);

    List<ConnectionMng> findAllByConnectionIdIn(List<Long> ids);

    boolean existsByConnectionId(Long id);
}
