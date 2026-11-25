package com.becon.opencelium.backend.slice.database.mysql.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.EventContent;
import com.becon.opencelium.backend.database.mysql.entity.EventMessage;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.repository.MessageRepository;
import com.becon.opencelium.backend.testutil.annotation.SliceTest;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

/**
 * JPA slice test for {@link MessageRepository}: the query that finds the templates the
 * notifications of a workflow's schedules send, read when the workflow moves to another category.
 *
 * A unit test cannot catch a subquery that follows the wrong join and returns the templates of
 * other workflows, or a fetch join that repeats a template once per text: the references of
 * the moved workflow's notifications would then be checked against the wrong texts.
 *
 * Run with: ./gradlew test --tests "*.MessageRepositoryTest"
 */
@SliceTest
@DisplayName("MessageRepository — JPA slice")
class MessageRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private MessageRepository repository;

    @Test
    @DisplayName("findSentByWorkflow — each template the workflow's notifications send, once, with all its texts")
    void findSentByWorkflowReturnsEachTemplateOnceWithContents() {
        Connection workflow = persistedWorkflow("VMware to i-doit");
        Scheduler nightly = persistedSchedule(workflow);
        Scheduler weekly = persistedSchedule(workflow);
        Scheduler ofOtherWorkflow = persistedSchedule(persistedWorkflow("i-doit to Jira"));
        EventMessage failure = persistedTemplate("Failure template",
                GlobalVariableFixture.aTemplateContent("en", null, "See {{global.supportUrl}}"),
                GlobalVariableFixture.aTemplateContent("de", null, "Siehe {{global.supportUrl}}"));
        EventMessage success = persistedTemplate("Success template",
                GlobalVariableFixture.aTemplateContent("en", null, "Done"));
        EventMessage ofOther = persistedTemplate("Jira template",
                GlobalVariableFixture.aTemplateContent("en", null, "Ticket created"));
        em.persist(GlobalVariableFixture.aNotification(0, "Nightly failure", failure, nightly));
        em.persist(GlobalVariableFixture.aNotification(0, "Weekly failure", failure, weekly));
        em.persist(GlobalVariableFixture.aNotification(0, "Nightly success", success, nightly));
        em.persist(GlobalVariableFixture.aNotification(0, "Hourly ticket", ofOther, ofOtherWorkflow));
        em.flush();
        em.clear();

        List<EventMessage> templates = repository.findSentByWorkflow(workflow.getId());

        assertThat(templates)
                .extracting(EventMessage::getName, template -> template.getEventContents().size())
                .containsExactlyInAnyOrder(tuple("Failure template", 2), tuple("Success template", 1));
    }

    @Test
    void findSentByWorkflowReturnsEmptyWhenWorkflowHasNoSchedule() {
        Connection workflow = persistedWorkflow("VMware to i-doit");
        Scheduler ofOtherWorkflow = persistedSchedule(persistedWorkflow("i-doit to Jira"));
        EventMessage ofOther = persistedTemplate("Jira template",
                GlobalVariableFixture.aTemplateContent("en", null, "Ticket created"));
        em.persist(GlobalVariableFixture.aNotification(0, "Hourly ticket", ofOther, ofOtherWorkflow));
        em.flush();
        em.clear();

        List<EventMessage> templates = repository.findSentByWorkflow(workflow.getId());

        assertThat(templates).isEmpty();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Connection persistedWorkflow(String title) {
        Connection workflow = new Connection();
        workflow.setTitle(title);
        return em.persistAndFlush(workflow);
    }

    private Scheduler persistedSchedule(Connection workflow) {
        Scheduler schedule = new Scheduler();
        schedule.setConnection(workflow);
        return em.persistAndFlush(schedule);
    }

    /** Stores a template and its texts; a text is stored on its own, as its template does not cascade it. */
    private EventMessage persistedTemplate(String name, EventContent... contents) {
        EventMessage template = em.persist(GlobalVariableFixture.aTemplate(0, name, contents));
        for (EventContent content : contents) {
            em.persist(content);
        }
        return template;
    }
}
