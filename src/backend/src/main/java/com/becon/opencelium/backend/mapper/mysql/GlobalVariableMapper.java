package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.EventNotification;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableChange;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableGrant;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableScopeTarget;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.entity.UserDetail;
import com.becon.opencelium.backend.database.mysql.repository.CategoryRepository;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.database.mysql.repository.ConnectorRepository;
import com.becon.opencelium.backend.database.mysql.repository.NotificationRepository;
import com.becon.opencelium.backend.database.mysql.repository.UserRepository;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.execution.globalvariable.GlobalScript;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableChangeDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableChangeDTO.ChangedField;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableDTO.Actor;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableDTO.CategoryRef;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableDTO.Mutable;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableDTO.Scope;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableDTO.UserRef;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableDTO.WorkflowRef;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableListItemDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariablePermissionsDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariablePermissionsDTO.Grant;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariablePickerItemDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableUsageDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableValueDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.TextNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;

/**
 * Builds the API representations of global variables.
 *
 * <p>Written by hand rather than generated: every representation needs names looked up in other
 * tables and JSON text parsed back into real JSON. Call it inside the transaction that loaded
 * the entity, because the scope targets and the grants are loaded lazily.
 */
@Component
public class GlobalVariableMapper {

    static final int PREVIEW_LENGTH = 100;

    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ConnectionRepository connectionRepository;
    private final ConnectorRepository connectorRepository;
    private final NotificationRepository notificationRepository;

    public GlobalVariableMapper(ObjectMapper objectMapper, UserRepository userRepository,
            CategoryRepository categoryRepository, ConnectionRepository connectionRepository,
            ConnectorRepository connectorRepository, NotificationRepository notificationRepository) {
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.connectionRepository = connectionRepository;
        this.connectorRepository = connectorRepository;
        this.notificationRepository = notificationRepository;
    }

    public GlobalVariableDTO toDetail(GlobalVariable variable, Set<GlobalVariablePermission> myPermissions) {
        boolean secret = variable.isSecret();
        GlobalScript script = scriptOf(variable);

        return new GlobalVariableDTO(
                variable.getId(),
                variable.getName(),
                variable.getKind(),
                variable.getDescription(),
                secret || script != null ? null : readJson(variable.getValue()),
                secret,
                script == null && variable.getValue() != null,
                script,
                toScope(variable),
                toUserRef(variable.getOwnerUserId()),
                myPermissions,
                toMutable(variable),
                variable.getVersion(),
                toInstant(variable.getCreatedAt()),
                toActor(variable.getCreatedBy()),
                toInstant(variable.getUpdatedAt()),
                toActor(variable.getUpdatedBy()));
    }

    /**
     * Builds one row of the list.
     *
     * @param beingUpdatedBy the run that updates the variable now, or {@code null}
     */
    public GlobalVariableListItemDTO toListItem(GlobalVariable variable, Set<GlobalVariablePermission> myPermissions,
            long usageCount, GlobalVariableDTO.BeingUpdatedBy beingUpdatedBy) {
        GlobalScript script = scriptOf(variable);

        return new GlobalVariableListItemDTO(
                variable.getId(),
                variable.getName(),
                variable.getKind(),
                variable.getDescription(),
                variable.isSecret(),
                variable.isSecret() || script != null ? null : preview(variable.getReadableValue()),
                script == null ? null : script.language(),
                script == null ? null : script.parameters().size(),
                variable.getScopeType(),
                usageCount,
                myPermissions,
                variable.getVersion(),
                toInstant(variable.getUpdatedAt()),
                toActor(variable.getUpdatedBy()),
                beingUpdatedBy);
    }

    public GlobalVariablePermissionsDTO toPermissions(GlobalVariable variable) {
        Map<Integer, Set<GlobalVariablePermission>> byUser = new TreeMap<>();
        for (GlobalVariableGrant grant : variable.getGrants()) {
            byUser.computeIfAbsent(grant.getUserId(), id -> EnumSet.noneOf(GlobalVariablePermission.class))
                    .add(grant.getPermission());
        }

        List<Grant> grants = byUser.entrySet().stream()
                .map(entry -> new Grant(toUserRef(entry.getKey()), entry.getValue()))
                .toList();

        return new GlobalVariablePermissionsDTO(toUserRef(variable.getOwnerUserId()), grants, variable.getVersion());
    }

    /**
     * Builds one entry of the change log.
     *
     * @param secret whether the variable is a secret now: then every value of the log reads as
     *               {@link GlobalVariableChange#SECRET_MASK} and none is restorable, whatever the
     *               entry holds, so a value saved before the variable became a secret stays
     *               hidden
     */
    public GlobalVariableChangeDTO toChange(GlobalVariableChange change, boolean secret) {
        boolean fields = change.getChangeType() == GlobalVariableChange.Type.CONFIG
                || change.getChangeType() == GlobalVariableChange.Type.PERMISSIONS;

        return new GlobalVariableChangeDTO(
                change.getId(),
                change.getChangeType(),
                change.getVersionFrom(),
                change.getVersionTo(),
                fields ? null : loggedValue(change.getOldValue(), secret),
                fields ? null : loggedValue(change.getNewValue(), secret),
                fields ? toChangedFields(change) : null,
                toActor(change.getUserId()),
                change.getResult(),
                change.getReason(),
                toInstant(change.getChangedAt()),
                !secret && isRestorable(change));
    }

    public GlobalVariablePickerItemDTO toPickerItem(GlobalVariable variable) {
        GlobalScript script = scriptOf(variable);

        return new GlobalVariablePickerItemDTO(
                variable.getName(),
                variable.getKind(),
                variable.getDescription(),
                variable.isSecret(),
                variable.isSecret() || script != null ? null : preview(variable.getReadableValue()),
                script == null ? null : script.language(),
                script == null ? null : script.parameters());
    }

    /** Returns the script of a script variable, which its value column holds; {@code null} otherwise. */
    private static GlobalScript scriptOf(GlobalVariable variable) {
        if (variable.getKind() != GlobalVariableKind.SCRIPT || variable.getValue() == null) {
            return null;
        }

        try {
            return GlobalScript.fromJson(variable.getValue());
        } catch (IllegalStateException e) {
            throw new GeneralServiceException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "CORRUPT_GLOBAL_VARIABLE_VALUE", "A stored script variable is not a valid script definition");
        }
    }

    /**
     * Builds the value a run reads now. For a mutable variable that is its current value, set by
     * a reset or a run, so the time and the user are those of the current value, not of the
     * definition.
     *
     * @param beingUpdatedBy the run that updates the variable now, or {@code null}
     */
    public GlobalVariableValueDTO toValue(GlobalVariable variable, GlobalVariableDTO.BeingUpdatedBy beingUpdatedBy) {
        boolean mutable = variable.getKind() == GlobalVariableKind.MUTABLE;

        return new GlobalVariableValueDTO(
                variable.getId(),
                variable.getVersion(),
                variable.getCurrentRevision(),
                variable.isSecret() ? null : readJson(variable.getReadableValue()),
                toInstant(mutable ? variable.getCurrentSetAt() : variable.getUpdatedAt()),
                toActor(mutable ? variable.getCurrentSetByUser() : variable.getUpdatedBy()),
                beingUpdatedBy);
    }

    /**
     * Tells whether a variable can be set back to what a change log entry saved: the entry
     * saved a value, which a creation, a value change and an earlier restore do, and holds it,
     * which an entry of a secret does not.
     */
    public static boolean isRestorable(GlobalVariableChange change) {
        boolean savedValue = change.getChangeType() == GlobalVariableChange.Type.CREATE
                || change.getChangeType() == GlobalVariableChange.Type.VALUE
                || change.getChangeType() == GlobalVariableChange.Type.RESTORE;

        return savedValue && change.getResult() == GlobalVariableChange.Result.SAVED && change.getNewValue() != null
                && !GlobalVariableChange.SECRET_MASK.equals(change.getNewValue());
    }

    public GlobalVariableUsageDTO toUsage(GlobalVariableUsage usage) {
        return new GlobalVariableUsageDTO(
                usage.getSourceType(),
                usage.getSourceId(),
                sourceTitle(usage),
                usage.getElementType(),
                usage.getElementLabel(),
                usage.getElementColor(),
                usage.getElementRef(),
                usage.getField(),
                usage.getAccess());
    }

    /**
     * Returns the title of what holds a usage: the title of the workflow or the connector, the
     * name of the notification. Read now rather than stored, so a renamed source shows its new
     * title. {@code null} if the source no longer exists.
     */
    private String sourceTitle(GlobalVariableUsage usage) {
        long id = usage.getSourceId();

        return switch (usage.getSourceType()) {
            case WORKFLOW -> workflowTitle(id);
            case CONNECTOR -> connectorRepository.findById(Math.toIntExact(id)).map(Connector::getTitle).orElse(null);
            case NOTIFICATION -> notificationRepository.findById(Math.toIntExact(id))
                    .map(EventNotification::getName)
                    .orElse(null);
            // script variables hold no usages yet
            case SCRIPT_VARIABLE -> null;
        };
    }

    /**
     * Returns the name shown for a user: first name and surname when the profile has them,
     * otherwise the login. Empty when the user no longer exists.
     */
    public Optional<String> userName(Integer userId) {
        if (userId == null) {
            return Optional.empty();
        }

        return userRepository.findById(userId).map(GlobalVariableMapper::displayName);
    }

    private Mutable toMutable(GlobalVariable variable) {
        if (variable.getKind() != GlobalVariableKind.MUTABLE) {
            return null;
        }

        Long ownerWorkflowId = variable.getOwnerWorkflowId();
        return new Mutable(
                readJson(variable.getCurrentValue()),
                variable.getCurrentRevision(),
                toInstant(variable.getCurrentSetAt()),
                toActor(variable.getCurrentSetByUser()),
                variable.getCurrentSetByExecution(),
                variable.getBusyPolicy(),
                ownerWorkflowId == null ? null : new WorkflowRef(ownerWorkflowId, workflowTitle(ownerWorkflowId)));
    }

    private Scope toScope(GlobalVariable variable) {
        List<CategoryRef> categories = new ArrayList<>();
        List<WorkflowRef> workflows = new ArrayList<>();

        variable.getScopeTargets().stream()
                .sorted(Comparator.comparing(GlobalVariableScopeTarget::getTargetId))
                .forEach(target -> {
                    long id = target.getTargetId();
                    if (target.getTargetType() == GlobalVariableScopeTarget.Type.CATEGORY) {
                        categories.add(new CategoryRef(id, categoryName(id)));
                    } else {
                        workflows.add(new WorkflowRef(id, workflowTitle(id)));
                    }
                });

        return new Scope(variable.getScopeType(), categories, workflows);
    }

    private String categoryName(long id) {
        if (id > Integer.MAX_VALUE) {
            return null;
        }

        return categoryRepository.findById((int) id).map(Category::getName).orElse(null);
    }

    private String workflowTitle(long id) {
        return connectionRepository.findById(id).map(Connection::getTitle).orElse(null);
    }

    private List<ChangedField> toChangedFields(GlobalVariableChange change) {
        JsonNode before = change.getOldValue() == null ? NullNode.getInstance() : readJson(change.getOldValue());
        JsonNode after = change.getNewValue() == null ? NullNode.getInstance() : readJson(change.getNewValue());

        Set<String> names = new LinkedHashSet<>();
        before.fieldNames().forEachRemaining(names::add);
        after.fieldNames().forEachRemaining(names::add);

        return names.stream()
                .map(name -> new ChangedField(name, before.get(name), after.get(name)))
                .toList();
    }

    /**
     * Returns a value of the change log as the API shows it: {@code null} for no value, the mask
     * for the value of a secret, the JSON otherwise.
     */
    private JsonNode loggedValue(String text, boolean secret) {
        if (text == null) {
            return null;
        }

        return secret || GlobalVariableChange.SECRET_MASK.equals(text)
                ? TextNode.valueOf(GlobalVariableChange.SECRET_MASK)
                : readJson(text);
    }

    private UserRef toUserRef(Integer userId) {
        return userId == null ? null : new UserRef(userId, userName(userId).orElse(null));
    }

    private Actor toActor(Integer userId) {
        return userId == null ? null : Actor.user(userId, userName(userId).orElse(null));
    }

    private JsonNode readJson(String text) {
        if (text == null) {
            return NullNode.getInstance();
        }

        try {
            return objectMapper.readTree(text);
        } catch (JsonProcessingException e) {
            // writes only ever store serialized JSON, so the row was changed outside the API
            throw new GeneralServiceException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "CORRUPT_GLOBAL_VARIABLE_VALUE", "A stored global variable value is not valid JSON");
        }
    }

    private static String preview(String value) {
        if (value == null) {
            return null;
        }

        return value.length() <= PREVIEW_LENGTH ? value : value.substring(0, PREVIEW_LENGTH);
    }

    private static String displayName(User user) {
        UserDetail detail = user.getUserDetail();
        if (detail != null) {
            String fullName = (nullToEmpty(detail.getName()) + " " + nullToEmpty(detail.getSurname())).strip();
            if (!fullName.isEmpty()) {
                return fullName;
            }
        }

        return user.getPrincipal();
    }

    private static String nullToEmpty(String text) {
        return text == null ? "" : text;
    }

    private static Instant toInstant(Date date) {
        return date == null ? null : date.toInstant();
    }
}
