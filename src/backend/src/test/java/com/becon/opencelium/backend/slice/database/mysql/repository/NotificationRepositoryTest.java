package com.becon.opencelium.backend.slice.database.mysql.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.database.mysql.entity.EventMessage;
import com.becon.opencelium.backend.database.mysql.entity.EventNotification;
import com.becon.opencelium.backend.database.mysql.repository.NotificationRepository;
import com.becon.opencelium.backend.testutil.annotation.SliceTest;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

/**
 * JPA slice test for {@link NotificationRepository}: the derived query that finds the
 * notifications a template is sent by.
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

    // ── helpers ───────────────────────────────────────────────────────────────

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
