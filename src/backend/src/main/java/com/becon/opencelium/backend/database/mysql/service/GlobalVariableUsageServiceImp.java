package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.EventContent;
import com.becon.opencelium.backend.database.mysql.entity.EventMessage;
import com.becon.opencelium.backend.database.mysql.entity.EventNotification;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage.Access;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage.SourceType;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableUsageRepository;
import com.becon.opencelium.backend.database.mysql.repository.MessageRepository;
import com.becon.opencelium.backend.database.mysql.repository.NotificationRepository;
import com.becon.opencelium.backend.database.mysql.repository.NotificationRepository.WorkflowNotification;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException.Violation;
import com.becon.opencelium.backend.validation.connection.GlobalReferenceCollector;
import com.becon.opencelium.backend.validation.connection.GlobalReferenceCollector.Found;
import com.becon.opencelium.backend.validation.connection.GlobalReferenceValidator;
import com.becon.opencelium.backend.validation.connection.GlobalReferenceValidator.NotificationTarget;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.BiFunction;
import java.util.stream.Collectors;

@Service
public class GlobalVariableUsageServiceImp implements GlobalVariableUsageService {

    // the id of a template that is not saved yet: no notification sends it
    private static final int NOT_SAVED_YET = 0;

    private final GlobalVariableUsageRepository usageRepository;
    private final GlobalVariableRepository globalVariableRepository;
    private final NotificationRepository notificationRepository;
    private final MessageRepository messageRepository;
    private final GlobalReferenceValidator referenceValidator;

    public GlobalVariableUsageServiceImp(
            GlobalVariableUsageRepository usageRepository,
            GlobalVariableRepository globalVariableRepository,
            NotificationRepository notificationRepository,
            MessageRepository messageRepository,
            GlobalReferenceValidator referenceValidator) {
        this.usageRepository = usageRepository;
        this.globalVariableRepository = globalVariableRepository;
        this.notificationRepository = notificationRepository;
        this.messageRepository = messageRepository;
        this.referenceValidator = referenceValidator;
    }

    // ------------------------------------------------------------------ workflows

    @Override
    public void checkWorkflow(ConnectionMng connectionMng, Long connectionId, Integer categoryId) {
        referenceValidator.validate(connectionMng, connectionId, categoryId);
    }

    @Override
    @Transactional
    public void rebuildForWorkflow(long connectionId, ConnectionMng connectionMng) {
        usageRepository.deleteBySource(SourceType.WORKFLOW, connectionId);

        saveUsages(GlobalReferenceCollector.collect(connectionMng),
                (variable, reference) -> workflowUsage(variable, connectionId, reference));
    }

    /**
     * The usage of a variable by a reference in a workflow: a write, an import of a script into
     * an enhancement, or a read.
     */
    private static GlobalVariableUsage workflowUsage(GlobalVariable variable, long connectionId, Found reference) {
        if (reference.write()) {
            return GlobalVariableUsage.writeByWorkflow(variable.getId(), connectionId, reference.elementType(),
                    reference.index(), reference.color(), reference.label(), reference.field());
        }
        if (reference.importing() && variable.getKind() == GlobalVariableKind.SCRIPT) {
            return GlobalVariableUsage.importByWorkflow(variable.getId(), connectionId, reference.elementType(),
                    reference.index(), reference.color(), reference.label(), reference.field());
        }

        return GlobalVariableUsage.readByWorkflow(variable.getId(), connectionId, reference.elementType(),
                reference.index(), reference.color(), reference.label(), reference.field());
    }

    @Override
    @Transactional
    public void deleteForWorkflow(long connectionId) {
        usageRepository.deleteBySource(SourceType.WORKFLOW, connectionId);
    }

    // ------------------------------------------------------------------ connectors

    @Override
    public void checkConnector(Map<String, String> requestData) {
        referenceValidator.validateConnector(requestData);
    }

    @Override
    @Transactional
    public void rebuildForConnector(long connectorId, Map<String, String> requestData) {
        usageRepository.deleteBySource(SourceType.CONNECTOR, connectorId);

        saveConnectorUsages(connectorId, requestData);
    }

    @Override
    @Transactional
    public void rebuildForConnectorFields(long connectorId, Map<String, String> requestData) {
        if (requestData == null || requestData.isEmpty()) {
            return;
        }

        usageRepository.deleteBySourceAndFields(SourceType.CONNECTOR, connectorId, requestData.keySet());

        saveConnectorUsages(connectorId, requestData);
    }

    @Override
    @Transactional
    public void deleteForConnector(long connectorId) {
        usageRepository.deleteBySource(SourceType.CONNECTOR, connectorId);
    }

    private void saveConnectorUsages(long connectorId, Map<String, String> requestData) {
        saveUsages(GlobalReferenceCollector.collectFromTexts(requestData), (variable, reference) ->
                GlobalVariableUsage.readByConnector(variable.getId(), connectorId, reference.field()));
    }

    // ------------------------------------------------------------------ notifications

    @Override
    @Transactional(readOnly = true)
    public void checkNotification(EventNotification notification) {
        referenceValidator.validateNotifications(
                textsOf(notification.getEventMessage()), targetOf(notification).map(List::of).orElse(List.of()));
    }

    @Override
    @Transactional
    public void rebuildForNotification(EventNotification notification) {
        EventMessage template = notification.getEventMessage();

        replaceNotificationUsages(notification.getId(), template,
                GlobalReferenceCollector.collectFromTexts(textsOf(template)));
    }

    @Override
    @Transactional
    public void deleteForNotification(long notificationId) {
        usageRepository.deleteBySource(SourceType.NOTIFICATION, notificationId);
    }

    @Override
    @Transactional(readOnly = true)
    public void checkTemplate(EventMessage template) {
        Map<String, String> texts = textsOf(template);
        if (GlobalReferenceCollector.collectFromTexts(texts).isEmpty()) {
            // nothing to check, so the notifications of the template are not read
            return;
        }

        List<NotificationTarget> notifications = notificationsOf(template.getId()).stream()
                .map(GlobalVariableUsageServiceImp::targetOf)
                .flatMap(Optional::stream)
                .toList();

        referenceValidator.validateNotifications(texts, notifications);
    }

    @Override
    @Transactional
    public void rebuildForTemplate(EventMessage template) {
        List<Found> references = GlobalReferenceCollector.collectFromTexts(textsOf(template));

        for (EventNotification notification : notificationsOf(template.getId())) {
            replaceNotificationUsages(notification.getId(), template, references);
        }
    }

    @Override
    @Transactional
    public void deleteForTemplate(int templateId) {
        for (EventNotification notification : notificationsOf(templateId)) {
            usageRepository.deleteBySource(SourceType.NOTIFICATION, (long) notification.getId());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Long> workflowOfNotification(long notificationId) {
        return notificationRepository.findById(Math.toIntExact(notificationId))
                .flatMap(GlobalVariableUsageServiceImp::targetOf)
                .map(NotificationTarget::workflowId);
    }

    private void replaceNotificationUsages(long notificationId, EventMessage template, List<Found> references) {
        usageRepository.deleteBySource(SourceType.NOTIFICATION, notificationId);

        String templateName = template == null ? null : template.getName();
        saveUsages(references, (variable, reference) -> GlobalVariableUsage.readByNotification(
                variable.getId(), notificationId, templateName, reference.field()));
    }

    private List<EventNotification> notificationsOf(int templateId) {
        return templateId == NOT_SAVED_YET ? List.of() : notificationRepository.findByEventMessageId(templateId);
    }

    /**
     * Returns what decides the scope of a notification: the workflow its schedule runs. Empty
     * for a notification without a schedule or a workflow, which has no scope to be checked
     * against.
     */
    private static Optional<NotificationTarget> targetOf(EventNotification notification) {
        if (notification.getScheduler() == null || notification.getScheduler().getConnection() == null) {
            return Optional.empty();
        }

        Connection workflow = notification.getScheduler().getConnection();

        return Optional.of(new NotificationTarget(notification.getName(), workflow.getId(), workflow.getCategoryId()));
    }

    /**
     * Returns the texts of a template that a notification sends, by name: {@code en.subject} and
     * {@code en.body} for the content written in {@code en}.
     */
    private static Map<String, String> textsOf(EventMessage template) {
        Map<String, String> texts = new LinkedHashMap<>();
        if (template == null || template.getEventContents() == null) {
            return texts;
        }

        for (EventContent content : template.getEventContents()) {
            if (content == null) {
                continue;
            }

            String language = content.getLanguage() == null || content.getLanguage().isBlank()
                    ? "content"
                    : content.getLanguage();
            addText(texts, language + ".subject", content.getSubject());
            addText(texts, language + ".body", content.getBody());
        }

        return texts;
    }

    // two contents in one language share a name: their texts are joined, so no reference is lost
    private static void addText(Map<String, String> texts, String name, String text) {
        if (text != null) {
            texts.merge(name, text, (first, second) -> first + "\n" + second);
        }
    }

    // ------------------------------------------------------------------ moves

    @Override
    @Transactional(readOnly = true)
    public void checkWorkflowMove(ConnectionMng connectionMng, long connectionId, Integer categoryId) {
        List<Violation> violations = new ArrayList<>();
        if (connectionMng != null) {
            collectViolations(violations, () -> referenceValidator.validate(connectionMng, connectionId, categoryId));
        }

        // the templates are read first: when none of them holds a reference, no notification is read
        Map<Integer, Map<String, String>> textsByTemplate =
                textsWithReferences(messageRepository.findSentByWorkflow(connectionId));
        if (!textsByTemplate.isEmpty()) {
            Map<Integer, List<NotificationTarget>> notificationsByTemplate = new LinkedHashMap<>();
            for (WorkflowNotification notification : notificationRepository.findByWorkflow(connectionId)) {
                Integer templateId = notification.getTemplateId();
                if (templateId != null && textsByTemplate.containsKey(templateId)) {
                    notificationsByTemplate.computeIfAbsent(templateId, id -> new ArrayList<>())
                            .add(new NotificationTarget(notification.getName(),
                                    scheduleName(notification.getScheduleId(), notification.getScheduleTitle()),
                                    connectionId, categoryId));
                }
            }

            checkSentTexts(textsByTemplate, notificationsByTemplate, violations);
        }

        throwIfAny(violations);
    }

    @Override
    @Transactional(readOnly = true)
    public void checkScheduleWorkflowChange(Scheduler schedule, Connection workflow) {
        List<EventNotification> notifications = schedule.getEventNotifications();
        if (workflow == null || workflow.getId() == null || notifications == null || notifications.isEmpty()) {
            return;
        }

        // a template that several notifications send is looked at once
        Map<Integer, EventMessage> templates = new LinkedHashMap<>();
        for (EventNotification notification : notifications) {
            EventMessage template = notification.getEventMessage();
            if (template != null) {
                templates.putIfAbsent(template.getId(), template);
            }
        }

        Map<Integer, Map<String, String>> textsByTemplate = textsWithReferences(templates.values());
        if (textsByTemplate.isEmpty()) {
            return;
        }

        String scheduleName = scheduleName(schedule.getId(), schedule.getTitle());
        Map<Integer, List<NotificationTarget>> notificationsByTemplate = new LinkedHashMap<>();
        for (EventNotification notification : notifications) {
            EventMessage template = notification.getEventMessage();
            if (template != null && textsByTemplate.containsKey(template.getId())) {
                notificationsByTemplate.computeIfAbsent(template.getId(), id -> new ArrayList<>())
                        .add(new NotificationTarget(notification.getName(), scheduleName,
                                workflow.getId(), workflow.getCategoryId()));
            }
        }

        List<Violation> violations = new ArrayList<>();
        checkSentTexts(textsByTemplate, notificationsByTemplate, violations);
        throwIfAny(violations);
    }

    /** Keeps the texts of the templates that hold a global variable reference, by template id. */
    private static Map<Integer, Map<String, String>> textsWithReferences(Collection<EventMessage> templates) {
        Map<Integer, Map<String, String>> textsByTemplate = new HashMap<>();
        for (EventMessage template : templates) {
            Map<String, String> texts = textsOf(template);
            if (!GlobalReferenceCollector.collectFromTexts(texts).isEmpty()) {
                textsByTemplate.put(template.getId(), texts);
            }
        }

        return textsByTemplate;
    }

    /** Checks the texts of each template against the notifications that send them. */
    private void checkSentTexts(Map<Integer, Map<String, String>> textsByTemplate,
            Map<Integer, List<NotificationTarget>> notificationsByTemplate, List<Violation> violations) {
        notificationsByTemplate.forEach((templateId, notifications) -> collectViolations(violations,
                () -> referenceValidator.validateNotifications(textsByTemplate.get(templateId), notifications)));
    }

    /**
     * Runs a check and keeps its violations, so that everything a move breaks is reported at
     * once. A check that fails has marked the transaction for rollback, which is right: a move
     * with a violation is always refused.
     */
    private static void collectViolations(List<Violation> violations, Runnable check) {
        try {
            check.run();
        } catch (GlobalReferenceValidationException e) {
            violations.addAll(e.getViolations());
        }
    }

    private static void throwIfAny(List<Violation> violations) {
        if (!violations.isEmpty()) {
            throw new GlobalReferenceValidationException(violations);
        }
    }

    /** Names a schedule in a message: by its title, or by its id when it has none. */
    private static String scheduleName(Integer scheduleId, String title) {
        return title == null || title.isBlank() ? "#" + scheduleId : "'" + title + "'";
    }

    // ------------------------------------------------------------------ reading

    @Override
    @Transactional
    public List<GlobalVariableUsage> findByVariable(long variableId) {
        usageRepository.deleteUsagesOfMissingSources();

        return usageRepository.findByVariableIdOrderBySourceTypeAscSourceIdAscElementRefAscIdAsc(variableId);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, Long> countByVariables(Collection<Long> variableIds) {
        Map<Long, Long> counts = new HashMap<>();
        if (variableIds.isEmpty()) {
            return counts;
        }

        for (Object[] row : usageRepository.countByVariableIds(variableIds)) {
            counts.put((Long) row[0], (Long) row[1]);
        }

        return counts;
    }

    /**
     * Writes one usage per variable, place and access for the references of a source. A
     * reference to a variable that does not exist leaves no usage.
     *
     * @param toUsage builds the usage of a variable for a reference
     */
    private void saveUsages(List<Found> references, BiFunction<GlobalVariable, Found, GlobalVariableUsage> toUsage) {
        if (references.isEmpty()) {
            return;
        }

        // a write target that names no variable has none
        Set<String> names = references.stream().map(Found::variable).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<String, GlobalVariable> variablesByName = new HashMap<>();
        for (GlobalVariable variable : globalVariableRepository.findByNameIn(names)) {
            variablesByName.put(variable.getName(), variable);
        }

        // one row per variable and place: the same reference written twice in a field counts once
        Set<Place> places = new LinkedHashSet<>();
        List<GlobalVariableUsage> usages = new ArrayList<>();
        for (Found reference : references) {
            // by the exact name, as a run resolves it; an unknown variable has nothing to guard
            GlobalVariable variable = variablesByName.get(reference.variable());
            if (variable == null) {
                continue;
            }

            GlobalVariableUsage usage = toUsage.apply(variable, reference);
            if (places.add(new Place(variable.getId(), reference.index(), reference.field(), usage.getAccess()))) {
                usages.add(usage);
            }
        }

        usageRepository.saveAll(usages);
    }

    /**
     * Where in a source a variable is used and how; a connector and a notification have no index.
     */
    private record Place(long variableId, String index, String field, Access access) {
    }
}
