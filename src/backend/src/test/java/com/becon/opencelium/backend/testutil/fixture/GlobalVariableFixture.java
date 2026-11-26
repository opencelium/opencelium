package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.EventContent;
import com.becon.opencelium.backend.database.mysql.entity.EventMessage;
import com.becon.opencelium.backend.database.mysql.entity.EventNotification;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.repository.NotificationRepository.WorkflowNotification;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableBusyPolicy;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableRequestDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.TextNode;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Named test objects for global variables and for what references them outside a workflow: the
 * notification templates and the notifications that send them.
 */
public final class GlobalVariableFixture {

    /** The key the encrypted fixtures below are made with. */
    public static final String SECRET_KEY = "test-key";

    /**
     * The JSON value {@code "s3cr3t"} encrypted with {@link #SECRET_KEY} and a fixed IV. Fixed
     * rather than encrypted per run: with a random IV, about one decryption in 256 with a wrong
     * key passes the padding check by chance; with this one, the key "another-key" always fails.
     */
    public static final String S3CR3T_ENCRYPTED = "AAECAwQFBgcICQoLDA0OD2u1WXnRxWMQvzSbWavf58w=";

    /**
     * The JSON value {@code "s3cr3t"} encrypted with the built-in default key of
     * {@code GlobalVariableCipher} and the same fixed IV, for the same reason: with this one,
     * {@link #SECRET_KEY} always fails.
     */
    public static final String S3CR3T_ENCRYPTED_WITH_DEFAULT_KEY = "AAECAwQFBgcICQoLDA0OD9piuAvszpM9SxSMscQ2g5M=";

    private GlobalVariableFixture() {}

    /**
     * Unsaved constant (id = null, version = 1) with scope ALL and the JSON value {@code "value"}.
     * Use when a test persists the variable itself.
     */
    public static GlobalVariable aTransientConstant(String name, Integer ownerUserId) {
        GlobalVariable variable = new GlobalVariable();
        variable.setName(name);
        variable.setKind(GlobalVariableKind.CONSTANT);
        variable.setValue("\"value\"");
        variable.setScopeType(GlobalVariableScopeType.ALL);
        variable.setOwnerUserId(ownerUserId);
        return variable;
    }

    /**
     * Saved constant with scope ALL, owned by user 1.
     * Use when a test needs a variable that already exists.
     *
     * @param jsonValue the stored value as JSON text, e.g. {@code "\"old\""}
     */
    public static GlobalVariable aConstant(long id, String name, String jsonValue) {
        GlobalVariable variable = aTransientConstant(name, 1);
        variable.setId(id);
        variable.setValue(jsonValue);
        return variable;
    }

    /**
     * Saved mutable variable with scope ALL and busy policy QUEUE, owned by user 1, whose current
     * value was set once since creation (revision 1).
     *
     * @param initialJson     the initial value as JSON text
     * @param currentJson     the current value as JSON text
     * @param ownerWorkflowId the only owner workflow, whose runs may write it; {@code null} for no
     *                        owner, as once every owner workflow is deleted. Add further owners to
     *                        {@link GlobalVariable#getOwnerWorkflowIds()}
     */
    public static GlobalVariable aMutable(
            long id, String name, String initialJson, String currentJson, Long ownerWorkflowId) {
        GlobalVariable variable = aConstant(id, name, initialJson);
        variable.setKind(GlobalVariableKind.MUTABLE);
        variable.setCurrentValue(currentJson);
        variable.setCurrentRevision(1);
        variable.setBusyPolicy(GlobalVariableBusyPolicy.QUEUE);
        variable.setOwnerWorkflowIds(ownerWorkflowId == null ? new HashSet<>() : new HashSet<>(Set.of(ownerWorkflowId)));
        return variable;
    }

    /**
     * Request for a mutable variable with scope ALL, no description and no busy policy.
     *
     * @param ownerWorkflowId the only owner workflow, whose runs may write it; {@code null} to
     *                        leave the owner workflows out
     * @param version         the version the form loaded; {@code null} for a create
     */
    public static GlobalVariableRequestDTO aMutableRequest(
            String name, JsonNode value, Long ownerWorkflowId, Long version) {
        return new GlobalVariableRequestDTO(name, GlobalVariableKind.MUTABLE, null, value, null, aScopeOfAll(),
                null, ownerWorkflowId == null ? null : List.of(ownerWorkflowId), version);
    }

    /**
     * Request for a constant with scope ALL and no description.
     *
     * @param version the version the form loaded; {@code null} for a create
     */
    public static GlobalVariableRequestDTO aRequest(String name, JsonNode value, Long version) {
        return new GlobalVariableRequestDTO(
                name, GlobalVariableKind.CONSTANT, null, value, false, aScopeOfAll(), null, null, version);
    }

    /** The code of {@code formatDate}: turns an ISO date into {@code pattern}, e.g. {@code dd.MM}. */
    public static final String FORMAT_DATE_CODE = """
            var d = new Date(date);
            var dd = ("0" + d.getUTCDate()).slice(-2);
            var mm = ("0" + (d.getUTCMonth() + 1)).slice(-2);
            return pattern.replace("dd", dd).replace("MM", mm).replace("yyyy", String(d.getUTCFullYear()));""";

    /**
     * The script of {@code formatDate} in JavaScript, with the parameter {@code date} (required)
     * and {@code pattern} (default {@code "dd.MM.yyyy"}).
     */
    public static GlobalVariableRequestDTO.Script aFormatDateScript() {
        return aScript(FORMAT_DATE_CODE,
                new GlobalVariableRequestDTO.Parameter("date", "ISO date text", null, null),
                new GlobalVariableRequestDTO.Parameter("pattern", null, null, TextNode.valueOf("dd.MM.yyyy")));
    }

    /** A JavaScript script with the given code and parameters. */
    public static GlobalVariableRequestDTO.Script aScript(String code, GlobalVariableRequestDTO.Parameter... parameters) {
        return new GlobalVariableRequestDTO.Script("js", code, List.of(parameters));
    }

    /**
     * Request for a script variable with scope ALL, no description and no value.
     *
     * @param version the version the form loaded; {@code null} for a create
     */
    public static GlobalVariableRequestDTO aScriptRequest(String name, GlobalVariableRequestDTO.Script script, Long version) {
        return new GlobalVariableRequestDTO(name, GlobalVariableKind.SCRIPT, null, null, null, aScopeOfAll(),
                null, null, version, script);
    }

    /**
     * Saved script variable with scope ALL, owned by user 1.
     *
     * @param definitionJson the stored definition, as {@code GlobalScript#toJson} writes it
     */
    public static GlobalVariable aScriptVariable(long id, String name, String definitionJson) {
        GlobalVariable variable = aConstant(id, name, definitionJson);
        variable.setKind(GlobalVariableKind.SCRIPT);
        return variable;
    }

    /** Scope that lets every workflow use the variable. */
    public static GlobalVariableRequestDTO.Scope aScopeOfAll() {
        return new GlobalVariableRequestDTO.Scope(GlobalVariableScopeType.ALL, List.of(), List.of());
    }

    // ── what a run or a connector reads ───────────────────────────────────────

    /** Snapshot entry (version 1) of a text variable that is open to all workflows. */
    public static GlobalVariableSnapshot.Entry anOpenEntry(String name, String text) {
        return new GlobalVariableSnapshot.Entry(name, 1, TextNode.valueOf(text));
    }

    /**
     * Snapshot entry (version 1) of a text variable that only some workflows may use.
     * Use where a connector, which is shared by every workflow, must not read the variable.
     */
    public static GlobalVariableSnapshot.Entry aScopedEntry(String name, String text) {
        return new GlobalVariableSnapshot.Entry(name, 1, TextNode.valueOf(text), false);
    }

    /** Snapshot that holds the given variables. */
    public static GlobalVariableSnapshot aSnapshotOf(GlobalVariableSnapshot.Entry... entries) {
        return GlobalVariableSnapshot.of(List.of(entries));
    }

    // ── what references global variables outside a workflow ───────────────────

    /**
     * One content of a notification template, written in {@code language}.
     *
     * @param subject the subject, or {@code null} for a content without one
     */
    public static EventContent aTemplateContent(String language, String subject, String body) {
        EventContent content = new EventContent();
        content.setLanguage(language);
        content.setSubject(subject);
        content.setBody(body);
        return content;
    }

    /**
     * Notification template with the given contents.
     *
     * @param id id of the template; 0 for a template that is not saved yet
     */
    public static EventMessage aTemplate(int id, String name, EventContent... contents) {
        EventMessage template = new EventMessage();
        template.setId(id);
        template.setName(name);
        template.setEventContents(new ArrayList<>(List.of(contents)));
        template.getEventContents().forEach(content -> content.setEventMessage(template));
        return template;
    }

    /**
     * Schedule that runs a workflow.
     *
     * @param categoryId category of the workflow, or {@code null} for a workflow without one
     */
    public static Scheduler aScheduleOf(long workflowId, Integer categoryId) {
        Scheduler schedule = new Scheduler();
        schedule.setConnection(aWorkflow(workflowId, categoryId));
        return schedule;
    }

    /**
     * Saved workflow, as far as the scope of a global variable sees it.
     *
     * @param categoryId category of the workflow, or {@code null} for a workflow without one
     */
    public static Connection aWorkflow(long workflowId, Integer categoryId) {
        Connection workflow = new Connection();
        workflow.setId(workflowId);
        workflow.setCategoryId(categoryId);
        return workflow;
    }

    /**
     * A notification of a schedule that runs a workflow, as such notifications are read when the
     * workflow moves to another category.
     *
     * @param templateId    the template it sends, or {@code null} for none
     * @param scheduleTitle title of its schedule, or {@code null} for an untitled one
     */
    public static WorkflowNotification aWorkflowNotification(
            int id, String name, Integer templateId, int scheduleId, String scheduleTitle) {
        return new WorkflowNotificationRow(id, name, templateId, scheduleId, scheduleTitle);
    }

    /**
     * Notification that sends a template.
     *
     * @param template the template it sends, or {@code null} where a test does not read it
     * @param schedule the schedule it belongs to, or {@code null} for a notification without one
     */
    public static EventNotification aNotification(int id, String name, EventMessage template, Scheduler schedule) {
        EventNotification notification = new EventNotification();
        notification.setId(id);
        notification.setName(name);
        notification.setEventMessage(template);
        notification.setScheduler(schedule);
        return notification;
    }

    /** A row of {@code NotificationRepository.findByWorkflow}, with equality for assertions. */
    private record WorkflowNotificationRow(Integer id, String name, Integer templateId, Integer scheduleId,
                                           String scheduleTitle) implements WorkflowNotification {

        @Override
        public Integer getId() {
            return id;
        }

        @Override
        public String getName() {
            return name;
        }

        @Override
        public Integer getTemplateId() {
            return templateId;
        }

        @Override
        public Integer getScheduleId() {
            return scheduleId;
        }

        @Override
        public String getScheduleTitle() {
            return scheduleTitle;
        }
    }
}
