package com.becon.opencelium.backend.slice.database.mysql.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.EventMessage;
import com.becon.opencelium.backend.database.mysql.entity.EventNotification;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.repository.NotificationRepository;
import com.becon.opencelium.backend.database.mysql.repository.NotificationRepository.WorkflowNotification;
import com.becon.opencelium.backend.testutil.annotation.SliceTest;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

/**
 * JPA slice test for {@link NotificationRepository}: the derived query that finds the
 * notifications a template is sent by, and the query that finds the notifications of the
 * schedules of a workflow when the workflow moves to another category.
 *
 * A unit test cannot catch a query that is derived from the wrong property and returns the
 * notifications of every template, or of none: the global variable references of a template
 * would then be checked against the wrong workflows.
 *
 * Run with: ./gradlew test --tests "*.NotificationRepositoryTest"
 */
@SliceTest
@DisplayName("NotificationRepository — JPA slice")
class NotificationRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private NotificationRepository repository;

    @Test
    @DisplayName("findByEventMessageId — the notifications of another template and of none are left out")
    void findByEventMessageIdReturnsNotificationsWhenTheySendTemplate() {
        EventMessage failureTemplate = persistedTemplate("Failure template");
        EventMessage successTemplate = persistedTemplate("Success template");
        em.persist(aNotification("Nightly failure", failureTemplate));
        em.persist(aNotification("Weekly failure", failureTemplate));
        em.persist(aNotification("Nightly success", successTemplate));
        em.persist(aNotification("Without template", null));
        em.flush();
        em.clear();

        List<EventNotification> notifications = repository.findByEventMessageId(failureTemplate.getId());

        assertThat(notifications).extracting(EventNotification::getName)
                .containsExactlyInAnyOrder("Nightly failure", "Weekly failure");
    }

    @Test
    @DisplayName("findByWorkflow — the notifications of every schedule of the workflow, by schedule, with what names them")
    void findByWorkflowReturnsNotificationsOfEveryScheduleOfWorkflow() {
        Connection workflow = persistedWorkflow("VMware to i-doit");
        Scheduler nightly = persistedSchedule("Nightly", workflow);
        Scheduler untitled = persistedSchedule(null, workflow);
        Scheduler ofOtherWorkflow = persistedSchedule("Hourly", persistedWorkflow("i-doit to Jira"));
        EventMessage template = persistedTemplate("Failure template");
        // the later schedule's notification is stored first: the order follows the schedules
        EventNotification untitledFailure =
                em.persist(GlobalVariableFixture.aNotification(0, "Untitled failure", template, untitled));
        EventNotification nightlyFailure =
                em.persist(GlobalVariableFixture.aNotification(0, "Nightly failure", template, nightly));
        em.persist(GlobalVariableFixture.aNotification(0, "Hourly failure", template, ofOtherWorkflow));
        em.flush();
        em.clear();

        List<WorkflowNotification> notifications = repository.findByWorkflow(workflow.getId());

        assertThat(notifications)
                .extracting(WorkflowNotification::getId, WorkflowNotification::getName,
                        WorkflowNotification::getTemplateId, WorkflowNotification::getScheduleId,
                        WorkflowNotification::getScheduleTitle)
                .containsExactly(
                        tuple(nightlyFailure.getId(), "Nightly failure", template.getId(), nightly.getId(), "Nightly"),
                        tuple(untitledFailure.getId(), "Untitled failure", template.getId(), untitled.getId(), null));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Connection persistedWorkflow(String title) {
        Connection workflow = new Connection();
        workflow.setTitle(title);
        return em.persistAndFlush(workflow);
    }

    private Scheduler persistedSchedule(String title, Connection workflow) {
        Scheduler schedule = new Scheduler();
        schedule.setTitle(title);
        schedule.setConnection(workflow);
        return em.persistAndFlush(schedule);
    }

    private EventMessage persistedTemplate(String name) {
        EventMessage template = new EventMessage();
        template.setName(name);
        return em.persistAndFlush(template);
    }

    private static EventNotification aNotification(String name, EventMessage template) {
        EventNotification notification = new EventNotification();
        notification.setName(name);
        notification.setEventMessage(template);
        return notification;
    }
}
