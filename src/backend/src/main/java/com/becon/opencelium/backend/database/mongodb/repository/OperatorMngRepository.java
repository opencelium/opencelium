package com.becon.opencelium.backend.database.mongodb.repository;

import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface OperatorMngRepository extends MongoRepository<OperatorMng, String> {
    @Query(value="{'_id' : ?0}", delete = true)
    public void deleteById(String id);
}
