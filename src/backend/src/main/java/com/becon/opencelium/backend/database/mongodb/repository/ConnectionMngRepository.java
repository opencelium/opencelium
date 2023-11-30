package com.becon.opencelium.backend.database.mongodb.repository;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConnectionMngRepository extends MongoRepository<ConnectionMng,String> {
    Optional<ConnectionMng> findByConnectionId(Long connectionId);
    @Query(value="{'_id' : ?0}", delete = true)
    public void deleteById(String id);
}
