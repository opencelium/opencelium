package com.becon.opencelium.backend.database.mongodb.repository;

import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface FieldBindingRepository extends MongoRepository<FieldBindingMng, String> {
    List<FieldBindingMng> findAllByEnhancementIdIn(List<Integer> enhancementIds);
    @Query(value="{'_id' : ?0}", delete = true)
    public void deleteById(String id);
}
