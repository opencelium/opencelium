package com.becon.opencelium.backend.validation.connection;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableScopeResolver;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException.Code;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException.Violation;
import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.becon.opencelium.backend.security.GlobalVariableSecurity;
import com.becon.opencelium.backend.security.GlobalVariableSecurity.Caller;
import com.becon.opencelium.backend.validation.connection.GlobalReferenceCollector.Found;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Checks the global variable references of a workflow, a connector or a notification that is
 * about to be saved.
 *
 * <p>Every reference must name a variable that exists, that may be used where the reference
 * stands and that the saving user may use. A script variable is only imported, by the whole
 * value of an arg of a JavaScript enhancement. The user is checked here and not when a workflow
 * runs, because runs execute as the system: a reference someone else added earlier is checked
 * against the user who saves now.
 */
@Component
public class GlobalReferenceValidator {

    // no variable lists a workflow that is not saved yet, so it matches no scope of chosen workflows
    private static final long NOT_SAVED_YET = -1L;

    private final GlobalVariableRepository globalVariableRepository;
    private final GlobalVariableSecurity security;
    private final GlobalVariableScopeResolver scopeResolver;

    public GlobalReferenceValidator(GlobalVariableRepository globalVariableRepository,
            GlobalVariableSecurity security, GlobalVariableScopeResolver scopeResolver) {
        this.globalVariableRepository = globalVariableRepository;
        this.security = security;
        this.scopeResolver = scopeResolver;
    }

    /**
     * A notification whose texts are checked: its references must be in the scope of the
     * workflow its schedule runs.
     *
     * @param name       name of the notification, for the message
     * @param schedule   how its schedule is named in the message, e.g. {@code 'Nightly'} or
     *                   {@code #12}, or {@code null} to name the notification alone
     * @param workflowId id of the workflow its schedule runs
     * @param categoryId category of that workflow, or {@code null} for none
     */
    public record NotificationTarget(String name, String schedule, long workflowId, Integer categoryId) {

        /** A notification that the message names without its schedule. */
        public NotificationTarget(String name, long workflowId, Integer categoryId) {
            this(name, null, workflowId, categoryId);
        }

        private String describe() {
            return schedule == null ? "'" + name + "'" : "'" + name + "' (schedule " + schedule + ")";
        }
    }

    /** Says why a variable may not be used where a reference stands, or nothing if it may. */
    @FunctionalInterface
    private interface ScopeRule {
        Optional<Violation> check(GlobalVariable variable, Found reference);
    }

    /**
     * Validates the references of {@code connectionMng}. A workflow without global variable
     * references is accepted without reading anything.
     *
     * @param connectionMng the workflow as it will be saved
     * @param connectionId  id of the workflow, or {@code null} if it is saved for the first time
     * @param categoryId    category the workflow will be in, or {@code null} for none
     * @throws GlobalReferenceValidationException if a reference cannot be used in this workflow
     */
    @Transactional(readOnly = true)
    public void validate(ConnectionMng connectionMng, Long connectionId, Integer categoryId) {
        List<Found> references = GlobalReferenceCollector.collect(connectionMng);
        if (references.isEmpty()) {
            return;
        }

        long workflowId = connectionId == null ? NOT_SAVED_YET : connectionId;
        Set<Long> categoryIds = scopeResolver.categoryChainOf(categoryId);

        validate(references, (variable, reference) -> {
            if (!variable.isInScopeOf(workflowId, categoryIds)) {
                return Optional.of(violation(Code.OUT_OF_SCOPE, reference,
                        "This workflow is outside the scope of global variable '%s'".formatted(reference.variable())));
            }

            return reference.write() ? checkWrite(variable, reference, workflowId) : Optional.empty();
        });
    }

    /**
     * Says why this workflow may not write a variable, or nothing if it may: only a mutable
     * variable is written, and only by its owner workflow. A workflow saved for the first time
     * owns nothing yet.
     */
    private static Optional<Violation> checkWrite(GlobalVariable variable, Found reference, long workflowId) {
        if (variable.getKind() != GlobalVariableKind.MUTABLE) {
            return Optional.of(violation(Code.NOT_MUTABLE, reference,
                    "Global variable '%s' is a %s; a method can only write a mutable variable"
                            .formatted(reference.variable(), variable.getKind())));
        }
        if (!Objects.equals(variable.getOwnerWorkflowId(), workflowId)) {
            return Optional.of(violation(Code.NOT_OWNER, reference,
                    "Only the owner workflow of global variable '%s' may write it, and this workflow is not its owner"
                            .formatted(reference.variable())));
        }

        return Optional.empty();
    }

    /**
     * Validates the references in the request data of a connector. A connector is shared by the
     * workflows of every category, so it may only use variables that are open to all workflows.
     *
     * @param requestData the values of the request data by the name of their field, as the user
     *                    wrote them
     * @throws GlobalReferenceValidationException if a reference cannot be used in a connector
     */
    @Transactional(readOnly = true)
    public void validateConnector(Map<String, String> requestData) {
        List<Found> references = GlobalReferenceCollector.collectFromTexts(requestData);
        if (references.isEmpty()) {
            return;
        }

        validate(references, (variable, reference) -> variable.getScopeType() == GlobalVariableScopeType.ALL
                ? Optional.empty()
                : Optional.of(violation(Code.SCOPE_NOT_ALL, reference,
                        "A connector may only use global variables that are open to all workflows, and '%s' is not"
                                .formatted(reference.variable()))));
    }

    /**
     * Validates the references in the texts of a notification template. A notification belongs
     * to a schedule of one workflow, so every notification that sends these texts must have its
     * workflow in the scope of each variable.
     *
     * @param texts         the texts of the template by name, e.g. {@code en.body}
     * @param notifications the notifications that send these texts; none if the template is not
     *                      used yet, and then only the variable and the user are checked
     * @throws GlobalReferenceValidationException if a reference cannot be used in these texts
     */
    @Transactional(readOnly = true)
    public void validateNotifications(Map<String, String> texts, List<NotificationTarget> notifications) {
        List<Found> references = GlobalReferenceCollector.collectFromTexts(texts);
        if (references.isEmpty()) {
            return;
        }

        // the category chain is read once per category, not once per notification or reference:
        // the notifications of one workflow share it
        Map<Integer, Set<Long>> chains = new HashMap<>();
        List<Reach> reaches = notifications.stream()
                .map(target -> new Reach(target,
                        chains.computeIfAbsent(target.categoryId(), scopeResolver::categoryChainOf)))
                .toList();

        validate(references, (variable, reference) -> {
            List<String> leftOut = reaches.stream()
                    .filter(reach -> !variable.isInScopeOf(reach.target().workflowId(), reach.categoryIds()))
                    .map(reach -> reach.target().describe())
                    .toList();

            return leftOut.isEmpty()
                    ? Optional.empty()
                    : Optional.of(violation(Code.OUT_OF_SCOPE, reference,
                            "The workflow of notification %s is outside the scope of global variable '%s'"
                                    .formatted(String.join(", ", leftOut), reference.variable())));
        });
    }

    /** A notification and the categories its workflow is in, from its own category up to the root. */
    private record Reach(NotificationTarget target, Set<Long> categoryIds) {
    }

    /**
     * Checks each reference in turn: the variable exists, {@code scopeRule} lets it be used
     * where the reference stands, and the saving user may use it.
     */
    private void validate(List<Found> references, ScopeRule scopeRule) {
        Set<String> names = references.stream().map(Found::variable).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<String, GlobalVariable> variables = globalVariableRepository.findByNameIn(names).stream()
                .collect(Collectors.toMap(GlobalVariable::getName, Function.identity(), (first, second) -> first));

        // no user means the system saves, for example a migration: only users are held to grants
        Optional<Caller> caller = security.caller();

        List<Violation> violations = new ArrayList<>();
        for (Found reference : references) {
            // a write replaces the whole value, so its target is global.name, without a path
            if (reference.write() && reference.variable() == null) {
                violations.add(violation(Code.INVALID_WRITE_TARGET, reference,
                        "'%s' names no global variable to write: write global.name in globalWrites and "
                                + "{{global.name}} in set(), without a path"
                                .formatted(reference.reference())));
                continue;
            }

            // looked up by the exact name: a run resolves references the same way
            GlobalVariable variable = variables.get(reference.variable());
            if (variable == null) {
                violations.add(violation(Code.UNKNOWN_VARIABLE, reference,
                        "Global variable '%s' does not exist".formatted(reference.variable())));
                continue;
            }

            Optional<Violation> misplaced = checkScriptUse(variable, reference);
            if (misplaced.isPresent()) {
                violations.add(misplaced.get());
                continue;
            }

            Optional<Violation> outOfReach = scopeRule.check(variable, reference);
            if (outOfReach.isPresent()) {
                violations.add(outOfReach.get());
            } else if (caller.isPresent() && !mayUse(variable, caller.get())) {
                violations.add(violation(Code.NO_USE_PERMISSION, reference,
                        "You have no permission to use global variable '%s'".formatted(reference.variable())));
            }
        }

        if (!violations.isEmpty()) {
            throw new GlobalReferenceValidationException(violations);
        }
    }

    /**
     * Says why a script variable may not be read where a reference stands, or nothing if it may:
     * a script has no value, so it is only imported as a function into a JavaScript enhancement,
     * by an arg whose whole value is {@code {{global.name}}}. A write to a script is refused
     * where writes are checked.
     */
    private static Optional<Violation> checkScriptUse(GlobalVariable variable, Found reference) {
        if (variable.getKind() != GlobalVariableKind.SCRIPT || reference.write()) {
            return Optional.empty();
        }
        if (!reference.importing()) {
            return Optional.of(violation(Code.SCRIPT_NOT_CALLABLE, reference,
                    ("Global variable '%s' is a script and has no value to read; import it in the args of a "
                            + "JavaScript enhancement as //var VAR_n = {{global.%s}}; without a path")
                            .formatted(reference.variable(), reference.variable())));
        }
        if (!LanguageType.JS.getCode().equals(reference.importInto())) {
            String language = reference.importInto().isEmpty()
                    ? "an enhancement without a language"
                    : "a '%s' enhancement".formatted(reference.importInto());
            return Optional.of(violation(Code.IMPORT_LANGUAGE_MISMATCH, reference,
                    "Script variable '%s' is JavaScript and cannot be imported into %s"
                            .formatted(reference.variable(), language)));
        }

        return Optional.empty();
    }

    private boolean mayUse(GlobalVariable variable, Caller caller) {
        return security.permissionsOn(variable, caller).contains(GlobalVariablePermission.VIEW_USE);
    }

    private static Violation violation(Code code, Found reference, String message) {
        return new Violation(code, message, reference.variable(), reference.reference(),
                reference.color(), reference.index(), reference.field());
    }
}
