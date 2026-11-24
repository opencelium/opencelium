package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.EventMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<EventMessage,Integer> {

    List<EventMessage> findAllByType(String type);

    /**
     * Finds the templates that the notifications of the schedules of a workflow send, with their
     * texts, in one query.
     *
     * @return each template once; empty when the workflow has no schedule with a notification
     */
    @Query("SELECT DISTINCT m FROM EventMessage m LEFT JOIN FETCH m.eventContents"
            + " WHERE m.id IN (SELECT n.eventMessage.id FROM EventNotification n"
            + " WHERE n.scheduler.connection.id = :workflowId)")
    List<EventMessage> findSentByWorkflow(@Param("workflowId") long workflowId);
}
