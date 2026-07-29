package com.becon.opencelium.backend.database.mongodb.repository;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ConnectionMngRepository extends MongoRepository<ConnectionMng,String> {
    @Query(value="{'_id' : ?1}", delete = true)
    void deleteById(String id);

    List<ConnectionMng> findAllByConnectionIdOrderByConnectionIdDesc(Long id);

    @Query(value = "{'_id' : {$in : ?0}}",
            fields = "{'connection_id' : 1, 'comment' : 1, 'createdAt' : 1, 'createdBy' : 1}")
    List<ConnectionMng> findVersionMetaByIdIn(Collection<String> snapshotIds);

    long deleteByConnectionIdIn(Collection<Long> connectionIds);

    void deleteAllByConnectionId(Long id);
}
