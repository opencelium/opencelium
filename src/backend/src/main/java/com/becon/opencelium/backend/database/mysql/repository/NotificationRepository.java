package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.EventNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<EventNotification, Integer> {
    @Transactional
    List<EventNotification> findBySchedulerId(int schedulerId);

    /** Finds the notifications that send the texts of a template. */
    List<EventNotification> findByEventMessageId(int eventMessageId);

    /**
     * Finds the notifications of every schedule that runs a workflow, in one query and without
     * loading the notifications, their schedules or their recipients.
     *
     * @return the notifications by schedule, then by notification, oldest first
     */
    @Query("SELECT n.id AS id, n.name AS name, n.eventMessage.id AS templateId,"
            + " s.id AS scheduleId, s.title AS scheduleTitle"
            + " FROM EventNotification n JOIN n.scheduler s"
            + " WHERE s.connection.id = :workflowId"
            + " ORDER BY s.id, n.id")
    List<WorkflowNotification> findByWorkflow(@Param("workflowId") long workflowId);

    /** A notification of a schedule that runs a workflow, with what a message names it by. */
    interface WorkflowNotification {

        Integer getId();

        String getName();

        /** The template whose texts the notification sends, or {@code null} for none. */
        Integer getTemplateId();

        Integer getScheduleId();

        String getScheduleTitle();
    }
}
