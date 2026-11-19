package com.becon.opencelium.backend.unit.database.mysql.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.entry;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mysql.entity.EventMessage;
import com.becon.opencelium.backend.database.mysql.entity.EventNotification;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage.Access;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage.ElementType;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage.SourceType;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableUsageRepository;
import com.becon.opencelium.backend.database.mysql.repository.NotificationRepository;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableUsageServiceImp;
import com.becon.opencelium.backend.testutil.fixture.ConnectionMngFixture;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.becon.opencelium.backend.validation.connection.GlobalReferenceValidator;
import com.becon.opencelium.backend.validation.connection.GlobalReferenceValidator.NotificationTarget;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link GlobalVariableUsageServiceImp}: how the usages of a workflow, a connector
 * and a notification follow their content, and what is handed to the reference check.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalVariableUsageServiceImpTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("GlobalVariableUsageServiceImp — unit")
class GlobalVariableUsageServiceImpTest {

    private static final long WORKFLOW = 11L;
    private static final long CONNECTOR = 7L;
    private static final int TEMPLATE = 3;
    // a notification has an int id; its usages hold it as the long id of their source
    private static final int NOTIFICATION = 21;
    private static final long NOTIFICATION_SOURCE = NOTIFICATION;

    @Mock
    GlobalVariableUsageRepository usageRepository;

    @Mock
    GlobalVariableRepository globalVariableRepository;

    @Mock
    NotificationRepository notificationRepository;

    @Mock
    GlobalReferenceValidator referenceValidator;

    @Captor
    ArgumentCaptor<Map<String, String>> checkedTexts;

    @Captor
    ArgumentCaptor<List<NotificationTarget>> checkedNotifications;

    @InjectMocks
    GlobalVariableUsageServiceImp service;

    // ── rebuildForWorkflow ────────────────────────────────────────────────────

    @Test
    @DisplayName("rebuild — the old usages go first, then one row per reference is written")
    void rebuildForWorkflowReplacesUsagesWhenWorkflowIsSaved() {
        MethodMng method = ConnectionMngFixture.aMethod("#ababab", "0_1", "listObjects", "{{global.idoitUrl}}/api");
        method.setLabel("List objects");
        method.getRequest().setHeader(Map.of("X-Tenant", "{{global.tenant}}"));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl", "tenant"))).thenReturn(List.of(
                GlobalVariableFixture.aConstant(5L, "idoitUrl", "1"),
                GlobalVariableFixture.aConstant(6L, "tenant", "1")));

        service.rebuildForWorkflow(WORKFLOW, ConnectionMngFixture.aWorkflowWith(method));

        InOrder order = inOrder(usageRepository);
        order.verify(usageRepository).deleteBySource(SourceType.WORKFLOW, WORKFLOW);
        order.verify(usageRepository).saveAll(any());
        assertThat(savedUsages())
                .extracting(GlobalVariableUsage::getVariableId, GlobalVariableUsage::getSourceType,
                        GlobalVariableUsage::getSourceId, GlobalVariableUsage::getElementType,
                        GlobalVariableUsage::getElementRef, GlobalVariableUsage::getElementColor,
                        GlobalVariableUsage::getElementLabel, GlobalVariableUsage::getField,
                        GlobalVariableUsage::getAccess)
                .containsExactly(
                        tuple(5L, SourceType.WORKFLOW, WORKFLOW, ElementType.METHOD, "0_1", "#ababab",
                                "List objects", "endpoint", Access.READ),
                        tuple(6L, SourceType.WORKFLOW, WORKFLOW, ElementType.METHOD, "0_1", "#ababab",
                                "List objects", "header.X-Tenant", Access.READ));
    }

    @Test
    void rebuildForWorkflowWritesOneRowWhenReferenceRepeatsInField() {
        ConnectionMng workflow = ConnectionMngFixture.aWorkflowWith(ConnectionMngFixture.aMethod(
                "#ababab", "0_1", "listObjects", "{{global.idoitUrl}}/api?next={{global.idoitUrl}}"));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl")))
                .thenReturn(List.of(GlobalVariableFixture.aConstant(5L, "idoitUrl", "1")));

        service.rebuildForWorkflow(WORKFLOW, workflow);

        assertThat(savedUsages()).extracting(GlobalVariableUsage::getVariableId, GlobalVariableUsage::getField)
                .containsExactly(tuple(5L, "endpoint"));
    }

    @Test
    @DisplayName("rebuild — a reference to a variable that does not exist leaves no usage")
    void rebuildForWorkflowSkipsReferenceWhenVariableDoesNotExist() {
        ConnectionMng workflow = ConnectionMngFixture.aWorkflowWith(ConnectionMngFixture.aMethod(
                "#ababab", "0_1", "listObjects", "{{global.idoitUrl}}/{{global.missing}}"));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl", "missing")))
                .thenReturn(List.of(GlobalVariableFixture.aConstant(5L, "idoitUrl", "1")));

        service.rebuildForWorkflow(WORKFLOW, workflow);

        assertThat(savedUsages()).extracting(GlobalVariableUsage::getVariableId).containsExactly(5L);
    }

    @Test
    void rebuildForWorkflowOnlyClearsWhenWorkflowHoldsNoReference() {
        ConnectionMng workflow = ConnectionMngFixture.aWorkflowWith(
                ConnectionMngFixture.aMethod("#ababab", "0_1", "listObjects", "{url}/api"));

        service.rebuildForWorkflow(WORKFLOW, workflow);

        verify(usageRepository).deleteBySource(SourceType.WORKFLOW, WORKFLOW);
        verify(usageRepository, never()).saveAll(any());
        verifyNoInteractions(globalVariableRepository);
    }

    // ── deleteForWorkflow ─────────────────────────────────────────────────────

    @Test
    void deleteForWorkflowRemovesUsagesWhenWorkflowIsDeleted() {
        service.deleteForWorkflow(WORKFLOW);

        verify(usageRepository).deleteBySource(SourceType.WORKFLOW, WORKFLOW);
    }

    // ── connectors ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("rebuildForConnector — a usage of a connector names its request data field and no element")
    void rebuildForConnectorReplacesUsagesWhenRequestDataHoldsReferences() {
        Map<String, String> requestData = new LinkedHashMap<>();
        requestData.put("url", "{{global.idoitUrl}}/api");
        requestData.put("token", "s3cr3t");
        requestData.put("tenant", "{{global.tenant}}");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl", "tenant"))).thenReturn(List.of(
                GlobalVariableFixture.aConstant(5L, "idoitUrl", "1"),
                GlobalVariableFixture.aConstant(6L, "tenant", "1")));

        service.rebuildForConnector(CONNECTOR, requestData);

        assertThat(savedUsages())
                .extracting(GlobalVariableUsage::getVariableId, GlobalVariableUsage::getSourceType,
                        GlobalVariableUsage::getSourceId, GlobalVariableUsage::getElementType,
                        GlobalVariableUsage::getElementRef, GlobalVariableUsage::getElementColor,
                        GlobalVariableUsage::getElementLabel, GlobalVariableUsage::getField,
                        GlobalVariableUsage::getAccess)
                .containsExactly(
                        tuple(5L, SourceType.CONNECTOR, CONNECTOR, null, null, null, null, "url", Access.READ),
                        tuple(6L, SourceType.CONNECTOR, CONNECTOR, null, null, null, null, "tenant", Access.READ));
        InOrder order = inOrder(usageRepository);
        order.verify(usageRepository).deleteBySource(SourceType.CONNECTOR, CONNECTOR);
        order.verify(usageRepository).saveAll(any());
    }

    @Test
    void rebuildForConnectorClearsUsagesWhenRequestDataHoldsNone() {
        service.rebuildForConnector(CONNECTOR, Map.of("url", "https://cmdb.example/api"));

        verify(usageRepository).deleteBySource(SourceType.CONNECTOR, CONNECTOR);
        verify(usageRepository, never()).saveAll(any());
        verifyNoInteractions(globalVariableRepository);
    }

    @Test
    @DisplayName("rebuildForConnectorFields — the usages of the fields that are not given stay as they are")
    void rebuildForConnectorFieldsReplacesOnlyGivenFieldsWhenValuesChange() {
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl")))
                .thenReturn(List.of(GlobalVariableFixture.aConstant(5L, "idoitUrl", "1")));

        service.rebuildForConnectorFields(CONNECTOR, Map.of("url", "{{global.idoitUrl}}/api"));

        assertThat(savedUsages())
                .extracting(GlobalVariableUsage::getVariableId, GlobalVariableUsage::getSourceType,
                        GlobalVariableUsage::getSourceId, GlobalVariableUsage::getField)
                .containsExactly(tuple(5L, SourceType.CONNECTOR, CONNECTOR, "url"));
        verify(usageRepository).deleteBySourceAndFields(SourceType.CONNECTOR, CONNECTOR, Set.of("url"));
        verify(usageRepository, never()).deleteBySource(any(), any());
    }

    @ParameterizedTest
    @NullAndEmptySource
    void rebuildForConnectorFieldsDoesNothingWhenNoFieldIsGiven(Map<String, String> requestData) {
        service.rebuildForConnectorFields(CONNECTOR, requestData);

        verifyNoInteractions(usageRepository, globalVariableRepository);
    }

    @Test
    void deleteForConnectorRemovesUsagesWhenConnectorIsDeleted() {
        service.deleteForConnector(CONNECTOR);

        verify(usageRepository).deleteBySource(SourceType.CONNECTOR, CONNECTOR);
    }

    // ── notifications ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("checkNotification — the texts of the template are checked against the workflow of the schedule")
    void checkNotificationChecksTemplateTextsWhenNotificationHasSchedule() {
        EventMessage template = GlobalVariableFixture.aTemplate(TEMPLATE, "Failure template",
                GlobalVariableFixture.aTemplateContent("en", "{{global.product}} failed", "See {{global.supportUrl}}"));
        EventNotification notification = GlobalVariableFixture.aNotification(
                NOTIFICATION, "Failure mail", template, GlobalVariableFixture.aScheduleOf(WORKFLOW, 3));

        service.checkNotification(notification);

        verify(referenceValidator).validateNotifications(checkedTexts.capture(), checkedNotifications.capture());
        assertThat(checkedTexts.getValue()).containsExactly(
                entry("en.subject", "{{global.product}} failed"),
                entry("en.body", "See {{global.supportUrl}}"));
        assertThat(checkedNotifications.getValue())
                .containsExactly(new NotificationTarget("Failure mail", WORKFLOW, 3));
    }

    @Test
    @DisplayName("checkNotification — two contents in one language share a name, so no reference is lost")
    void checkNotificationJoinsTextsWhenTwoContentsShareLanguage() {
        EventMessage template = GlobalVariableFixture.aTemplate(TEMPLATE, "Failure template",
                GlobalVariableFixture.aTemplateContent("en", "{{global.product}} failed", "See {{global.supportUrl}}"),
                GlobalVariableFixture.aTemplateContent("en", "Still failing", "Call {{global.hotline}}"));
        EventNotification notification = GlobalVariableFixture.aNotification(
                NOTIFICATION, "Failure mail", template, GlobalVariableFixture.aScheduleOf(WORKFLOW, null));

        service.checkNotification(notification);

        verify(referenceValidator).validateNotifications(checkedTexts.capture(), any());
        assertThat(checkedTexts.getValue()).containsExactly(
                entry("en.subject", "{{global.product}} failed\nStill failing"),
                entry("en.body", "See {{global.supportUrl}}\nCall {{global.hotline}}"));
    }

    @Test
    @DisplayName("checkNotification — without a schedule there is no workflow to be in scope of")
    void checkNotificationGivesNoTargetWhenNotificationHasNoSchedule() {
        EventMessage template = GlobalVariableFixture.aTemplate(TEMPLATE, "Failure template",
                GlobalVariableFixture.aTemplateContent("en", null, "See {{global.supportUrl}}"));
        EventNotification notification =
                GlobalVariableFixture.aNotification(NOTIFICATION, "Failure mail", template, null);

        service.checkNotification(notification);

        verify(referenceValidator).validateNotifications(checkedTexts.capture(), checkedNotifications.capture());
        assertThat(checkedTexts.getValue()).containsExactly(entry("en.body", "See {{global.supportUrl}}"));
        assertThat(checkedNotifications.getValue()).isEmpty();
    }

    @Test
    @DisplayName("rebuildForNotification — a usage of a notification names its template and the text")
    void rebuildForNotificationReplacesUsagesWhenTemplateHoldsReferences() {
        EventMessage template = GlobalVariableFixture.aTemplate(TEMPLATE, "Failure template",
                GlobalVariableFixture.aTemplateContent("en", "{{global.product}} failed", "See {{global.supportUrl}}"));
        EventNotification notification = GlobalVariableFixture.aNotification(
                NOTIFICATION, "Failure mail", template, GlobalVariableFixture.aScheduleOf(WORKFLOW, null));
        when(globalVariableRepository.findByNameIn(Set.of("product", "supportUrl"))).thenReturn(List.of(
                GlobalVariableFixture.aConstant(5L, "product", "1"),
                GlobalVariableFixture.aConstant(6L, "supportUrl", "1")));

        service.rebuildForNotification(notification);

        assertThat(savedUsages())
                .extracting(GlobalVariableUsage::getVariableId, GlobalVariableUsage::getSourceType,
                        GlobalVariableUsage::getSourceId, GlobalVariableUsage::getElementType,
                        GlobalVariableUsage::getElementRef, GlobalVariableUsage::getElementColor,
                        GlobalVariableUsage::getElementLabel, GlobalVariableUsage::getField,
                        GlobalVariableUsage::getAccess)
                .containsExactly(
                        tuple(5L, SourceType.NOTIFICATION, NOTIFICATION_SOURCE, null, null, null,
                                "Failure template", "en.subject", Access.READ),
                        tuple(6L, SourceType.NOTIFICATION, NOTIFICATION_SOURCE, null, null, null,
                                "Failure template", "en.body", Access.READ));
        InOrder order = inOrder(usageRepository);
        order.verify(usageRepository).deleteBySource(SourceType.NOTIFICATION, NOTIFICATION_SOURCE);
        order.verify(usageRepository).saveAll(any());
    }

    @Test
    void rebuildForNotificationClearsUsagesWhenTemplateHoldsNone() {
        EventMessage template = GlobalVariableFixture.aTemplate(TEMPLATE, "Failure template",
                GlobalVariableFixture.aTemplateContent("en", "Sync failed", "Have a look"));
        EventNotification notification = GlobalVariableFixture.aNotification(
                NOTIFICATION, "Failure mail", template, GlobalVariableFixture.aScheduleOf(WORKFLOW, null));

        service.rebuildForNotification(notification);

        verify(usageRepository).deleteBySource(SourceType.NOTIFICATION, NOTIFICATION_SOURCE);
        verify(usageRepository, never()).saveAll(any());
        verifyNoInteractions(globalVariableRepository);
    }

    @Test
    void deleteForNotificationRemovesUsagesWhenNotificationIsDeleted() {
        service.deleteForNotification(NOTIFICATION);

        verify(usageRepository).deleteBySource(SourceType.NOTIFICATION, NOTIFICATION_SOURCE);
    }

    // ── notification templates ────────────────────────────────────────────────

    @Test
    @DisplayName("checkTemplate — every notification that sends the template brings the workflow of its schedule")
    void checkTemplateChecksEveryNotificationWhenTemplateIsSent() {
        EventMessage template = GlobalVariableFixture.aTemplate(TEMPLATE, "Failure template",
                GlobalVariableFixture.aTemplateContent("en", null, "See {{global.supportUrl}}"));
        when(notificationRepository.findByEventMessageId(TEMPLATE)).thenReturn(List.of(
                GlobalVariableFixture.aNotification(
                        21, "Nightly", template, GlobalVariableFixture.aScheduleOf(11L, 3)),
                GlobalVariableFixture.aNotification(
                        22, "Weekly", template, GlobalVariableFixture.aScheduleOf(12L, null))));

        service.checkTemplate(template);

        verify(referenceValidator).validateNotifications(checkedTexts.capture(), checkedNotifications.capture());
        assertThat(checkedTexts.getValue()).containsExactly(entry("en.body", "See {{global.supportUrl}}"));
        assertThat(checkedNotifications.getValue()).containsExactly(
                new NotificationTarget("Nightly", 11L, 3),
                new NotificationTarget("Weekly", 12L, null));
    }

    @Test
    @DisplayName("checkTemplate — a template without global references costs no read at all")
    void checkTemplateReadsNoNotificationWhenTemplateHoldsNoReference() {
        EventMessage template = GlobalVariableFixture.aTemplate(TEMPLATE, "Failure template",
                GlobalVariableFixture.aTemplateContent("en", "Sync failed", "Have a look"));

        service.checkTemplate(template);

        verifyNoInteractions(notificationRepository, referenceValidator);
    }

    @Test
    @DisplayName("checkTemplate — a template that is not saved yet is sent by no notification")
    void checkTemplateGivesNoTargetWhenTemplateIsNotSavedYet() {
        EventMessage template = GlobalVariableFixture.aTemplate(0, "New template",
                GlobalVariableFixture.aTemplateContent("en", null, "See {{global.supportUrl}}"));

        service.checkTemplate(template);

        verify(referenceValidator).validateNotifications(checkedTexts.capture(), checkedNotifications.capture());
        assertThat(checkedTexts.getValue()).containsExactly(entry("en.body", "See {{global.supportUrl}}"));
        assertThat(checkedNotifications.getValue()).isEmpty();
        verifyNoInteractions(notificationRepository);
    }

    @Test
    @DisplayName("rebuildForTemplate — each notification that sends the template gets its usages written anew")
    void rebuildForTemplateRewritesUsagesWhenNotificationsSendTemplate() {
        EventMessage template = GlobalVariableFixture.aTemplate(TEMPLATE, "Failure template",
                GlobalVariableFixture.aTemplateContent("en", null, "See {{global.supportUrl}}"));
        when(notificationRepository.findByEventMessageId(TEMPLATE)).thenReturn(List.of(
                GlobalVariableFixture.aNotification(21, "Nightly", template, null),
                GlobalVariableFixture.aNotification(22, "Weekly", template, null)));
        when(globalVariableRepository.findByNameIn(Set.of("supportUrl")))
                .thenReturn(List.of(GlobalVariableFixture.aConstant(6L, "supportUrl", "1")));

        service.rebuildForTemplate(template);

        assertThat(savedUsages(2))
                .extracting(GlobalVariableUsage::getVariableId, GlobalVariableUsage::getSourceType,
                        GlobalVariableUsage::getSourceId, GlobalVariableUsage::getElementLabel,
                        GlobalVariableUsage::getField)
                .containsExactly(
                        tuple(6L, SourceType.NOTIFICATION, 21L, "Failure template", "en.body"),
                        tuple(6L, SourceType.NOTIFICATION, 22L, "Failure template", "en.body"));
        verify(usageRepository).deleteBySource(SourceType.NOTIFICATION, 21L);
        verify(usageRepository).deleteBySource(SourceType.NOTIFICATION, 22L);
    }

    @Test
    void deleteForTemplateRemovesUsagesWhenNotificationsSendTemplate() {
        when(notificationRepository.findByEventMessageId(TEMPLATE)).thenReturn(List.of(
                GlobalVariableFixture.aNotification(21, "Nightly", null, null),
                GlobalVariableFixture.aNotification(22, "Weekly", null, null)));

        service.deleteForTemplate(TEMPLATE);

        verify(usageRepository).deleteBySource(SourceType.NOTIFICATION, 21L);
        verify(usageRepository).deleteBySource(SourceType.NOTIFICATION, 22L);
    }

    @Test
    void workflowOfNotificationReturnsWorkflowWhenNotificationExists() {
        when(notificationRepository.findById(NOTIFICATION)).thenReturn(Optional.of(GlobalVariableFixture.aNotification(
                NOTIFICATION, "Failure mail", null, GlobalVariableFixture.aScheduleOf(WORKFLOW, 3))));

        Optional<Long> workflow = service.workflowOfNotification(NOTIFICATION);

        assertThat(workflow).contains(WORKFLOW);
    }

    @Test
    void workflowOfNotificationReturnsEmptyWhenNotificationIsGone() {
        when(notificationRepository.findById(NOTIFICATION)).thenReturn(Optional.empty());

        Optional<Long> workflow = service.workflowOfNotification(NOTIFICATION);

        assertThat(workflow).isEmpty();
    }

    // ── findByVariable ────────────────────────────────────────────────────────

    @Test
    @DisplayName("find — usages of workflows that are gone are removed before the list is read")
    void findByVariableRemovesOrphansBeforeReading() {
        GlobalVariableUsage usage = GlobalVariableUsage.readByWorkflow(
                5L, WORKFLOW, ElementType.METHOD, "0_1", "#ababab", "List objects", "endpoint");
        when(usageRepository.findByVariableIdOrderBySourceTypeAscSourceIdAscElementRefAscIdAsc(5L))
                .thenReturn(List.of(usage));

        List<GlobalVariableUsage> usages = service.findByVariable(5L);

        assertThat(usages).containsExactly(usage);
        InOrder order = inOrder(usageRepository);
        order.verify(usageRepository).deleteUsagesOfMissingSources();
        order.verify(usageRepository).findByVariableIdOrderBySourceTypeAscSourceIdAscElementRefAscIdAsc(5L);
    }

    // ── countByVariables ──────────────────────────────────────────────────────

    @Test
    void countByVariablesMapsCountsWhenVariablesAreUsed() {
        List<Object[]> rows = List.of(new Object[] {5L, 3L}, new Object[] {6L, 1L});
        when(usageRepository.countByVariableIds(List.of(5L, 6L, 7L))).thenReturn(rows);

        Map<Long, Long> counts = service.countByVariables(List.of(5L, 6L, 7L));

        assertThat(counts).containsOnly(Map.entry(5L, 3L), Map.entry(6L, 1L));
    }

    @Test
    void countByVariablesReadsNothingWhenNoIdIsGiven() {
        Map<Long, Long> counts = service.countByVariables(List.of());

        assertThat(counts).isEmpty();
        verifyNoInteractions(usageRepository);
    }

    // ── checkWorkflow ─────────────────────────────────────────────────────────

    @Test
    void checkWorkflowPassesWorkflowAndCategoryWhenWorkflowIsChecked() {
        ConnectionMng workflow = ConnectionMngFixture.aWorkflowWith();

        service.checkWorkflow(workflow, WORKFLOW, 3);

        verify(referenceValidator).validate(workflow, WORKFLOW, 3);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<GlobalVariableUsage> savedUsages() {
        ArgumentCaptor<List<GlobalVariableUsage>> saved = ArgumentCaptor.forClass(List.class);
        verify(usageRepository).saveAll(saved.capture());
        return saved.getValue();
    }

    /** The usages of every write, in the order written, when a call writes for several sources. */
    @SuppressWarnings("unchecked")
    private List<GlobalVariableUsage> savedUsages(int writes) {
        ArgumentCaptor<List<GlobalVariableUsage>> saved = ArgumentCaptor.forClass(List.class);
        verify(usageRepository, times(writes)).saveAll(saved.capture());
        return saved.getAllValues().stream().flatMap(List::stream).toList();
    }
}
