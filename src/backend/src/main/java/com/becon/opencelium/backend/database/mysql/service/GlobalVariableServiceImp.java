package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableChange;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableGrant;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableScopeTarget;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage;
import com.becon.opencelium.backend.database.mysql.repository.CategoryRepository;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableChangeRepository;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.database.mysql.repository.SchedulerRepository;
import com.becon.opencelium.backend.database.mysql.repository.UserRepository;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableBusyPolicy;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.exception.GlobalVariableConflictException;
import com.becon.opencelium.backend.exception.GlobalVariableConflictException.Blocking;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Code;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Violation;
import com.becon.opencelium.backend.execution.globalvariable.GlobalScript;
import com.becon.opencelium.backend.execution.globalvariable.WorkflowRunGate;
import com.becon.opencelium.backend.mapper.mysql.GlobalVariableMapper;
import com.becon.opencelium.backend.resource.globalvariable.GlobalScriptTestDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableChangeDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableImpactDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableListItemDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariablePermissionsDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariablePermissionsDTO.GrantRequest;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariablePickerItemDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableRequestDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableRestoreRequestDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableUsageDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableValueDTO;
import com.becon.opencelium.backend.resource.subs.PaginatedDto;
import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.becon.opencelium.backend.scriptengine.engines.NashornEngine;
import com.becon.opencelium.backend.scriptengine.ex.InvalidScriptException;
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
import com.becon.opencelium.backend.security.GlobalVariableSecurity;
import com.becon.opencelium.backend.security.GlobalVariableSecurity.Caller;
import com.becon.opencelium.backend.utility.crypto.GlobalVariableCipher;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class GlobalVariableServiceImp implements GlobalVariableService {

    private static final Pattern NAME = Pattern.compile("[A-Za-z][A-Za-z0-9_]{0,63}");
    private static final int DESCRIPTION_MAX_LENGTH = 512;
    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;
    private static final String DEFAULT_SORT = "name";
    private static final Set<String> SORTABLE = Set.of("name", "kind", "createdAt", "updatedAt");
    private static final String UNAUTHORIZED = "UNAUTHORIZED";
    private static final String NOT_FOUND = "GLOBAL_VARIABLE_NOT_FOUND";
    private static final String CHANGE_NOT_FOUND = "GLOBAL_VARIABLE_CHANGE_NOT_FOUND";
    private static final int MAX_VALUE_IDS = 100;
    // no variable lists a workflow that is not saved yet, nor a connector
    private static final long NO_WORKFLOW = -1L;
    private static final String REASON_IN_USE = "IN_USE";
    private static final String REASON_OUT_OF_SCOPE = "OUT_OF_SCOPE";
    private static final String REASON_PARAMETER_BREAKING = "PARAMETER_BREAKING";
    private static final String WARNING_CALLS_NOT_CHECKED = "CALLS_IN_CODE_NOT_CHECKED";
    // the component permission that opens the picker, see GlobalVariableController
    private static final String READ_PERMISSION = "READ";
    // the JSON text of a value that is left out; a secret stores no text for it
    private static final String JSON_NULL = "null";
    // languages script variables will support, which cannot be checked or run yet
    private static final Set<String> UNTESTABLE_LANGUAGES = Set.of(LanguageType.PYTHON_2.getCode(),
            LanguageType.PYTHON_3.getCode(), LanguageType.RUBY.getCode());
    // globals of the test call; the script's own names live inside its function and cannot clash
    private static final String TESTED_FUNCTION = "OC_TESTED";
    private static final String TEST_ARGUMENTS = "OC_TEST_ARGUMENTS";

    private final GlobalVariableRepository repository;
    private final GlobalVariableChangeRepository changeRepository;
    private final GlobalVariableMapper mapper;
    private final GlobalVariableSecurity security;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ConnectionRepository connectionRepository;
    private final SchedulerRepository schedulerRepository;
    private final GlobalVariableUsageService usageService;
    private final GlobalVariableScopeResolver scopeResolver;
    private final ObjectMapper objectMapper;
    private final GlobalVariableCipher cipher;
    private final WorkflowRunGate runGate;
    private final int maxValueBytes;
    private final int maxScriptBytes;
    private final NashornEngine nashornEngine;
    private final Duration scriptTimeLimit;

    public GlobalVariableServiceImp(
            GlobalVariableRepository repository,
            GlobalVariableChangeRepository changeRepository,
            GlobalVariableMapper mapper,
            GlobalVariableSecurity security,
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            ConnectionRepository connectionRepository,
            SchedulerRepository schedulerRepository,
            GlobalVariableUsageService usageService,
            GlobalVariableScopeResolver scopeResolver,
            ObjectMapper objectMapper,
            GlobalVariableCipher cipher,
            WorkflowRunGate runGate,
            @Value("${opencelium.global-variable.max-value-bytes:65536}") int maxValueBytes,
            @Value("${opencelium.global-variable.max-script-bytes:262144}") int maxScriptBytes,
            NashornEngine nashornEngine,
            @Value("${opencelium.global-variable.script-timeout-ms:5000}") long scriptTimeoutMs) {
        this.repository = repository;
        this.changeRepository = changeRepository;
        this.mapper = mapper;
        this.security = security;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.connectionRepository = connectionRepository;
        this.schedulerRepository = schedulerRepository;
        this.usageService = usageService;
        this.scopeResolver = scopeResolver;
        this.objectMapper = objectMapper;
        this.cipher = cipher;
        this.runGate = runGate;
        this.maxValueBytes = maxValueBytes;
        this.maxScriptBytes = maxScriptBytes;
        this.nashornEngine = nashornEngine;
        this.scriptTimeLimit = Duration.ofMillis(scriptTimeoutMs);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedDto<GlobalVariable, GlobalVariableListItemDTO> findAll(
            String search, GlobalVariableKind kind, int page, int size, String sort) {
        Caller caller = requireCaller();
        // an admin sees the variables of every user
        Integer visibleTo = caller.admin() ? null : caller.userId();

        Page<GlobalVariable> variables =
                repository.search(kind, toLikePattern(search), visibleTo, toPageable(page, size, sort));

        Map<Long, Long> usageCounts = usageService.countByVariables(
                variables.getContent().stream().map(GlobalVariable::getId).toList());

        return new PaginatedDto<>(variables, variable -> mapper.toListItem(
                variable, security.permissionsOn(variable, caller), usageCounts.getOrDefault(variable.getId(), 0L),
                beingUpdatedBy(variable)));
    }

    @Override
    @Transactional(readOnly = true)
    public GlobalVariableDTO getById(long id) {
        Caller caller = requireCaller();
        GlobalVariable variable = load(id);

        return mapper.toDetail(variable, require(variable, caller, GlobalVariablePermission.VIEW_USE));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isNameAvailable(String name) {
        return name != null && !repository.existsByNameIgnoreCase(name);
    }

    @Override
    @Transactional
    public GlobalVariableDTO create(GlobalVariableRequestDTO request) {
        Caller caller = requireCaller();

        List<Violation> violations = new ArrayList<>();
        String name = validateName(request.name(), null, violations);
        validateKindOnCreate(request.kind(), violations);
        boolean secret = Boolean.TRUE.equals(request.secret());
        validateSecret(request.kind(), secret, violations);
        String description = validateDescription(request.description(), violations);
        // a script variable stores its script where the other kinds store their value
        String value = request.kind() == GlobalVariableKind.SCRIPT
                ? validateScript(request, null, violations)
                : serializeValue(request.value(), violations);
        validateScriptOnly(request.kind(), request, violations);
        int violationsBeforeScope = violations.size();
        ScopeSpec scope = validateScope(request.scope(), violations);
        MutableSpec mutable = validateMutable(request.kind(), request, null, scope,
                violations.size() == violationsBeforeScope, violations);
        throwIfAny(violations);

        GlobalVariable variable = new GlobalVariable();
        variable.setName(name);
        variable.setKind(request.kind());
        variable.setDescription(description);
        variable.setSecret(secret);
        variable.setValue(secret ? encryptSecret(value) : value);
        variable.setScopeType(scope.type());
        variable.setScopeTargets(new HashSet<>(scope.targets()));
        variable.setOwnerUserId(caller.userId());
        if (mutable != null) {
            // the current value starts as the initial value, set by the creator
            variable.setCurrentValue(value);
            variable.setCurrentSetAt(new Date());
            variable.setCurrentSetByUser(caller.userId());
            variable.setBusyPolicy(mutable.busyPolicy());
            variable.setOwnerWorkflowId(mutable.ownerWorkflowId());
        }

        try {
            variable = repository.saveAndFlush(variable);
        } catch (DataIntegrityViolationException e) {
            // another request took the name between the check above and the insert
            throw new GlobalVariableValidationException(List.of(nameTaken(name)));
        }

        changeRepository.save(GlobalVariableChange.savedByUser(variable, GlobalVariableChange.Type.CREATE,
                null, variable.getVersion(), null, secret ? GlobalVariableChange.SECRET_MASK : value,
                caller.userId()));

        return mapper.toDetail(variable, security.permissionsOn(variable, caller));
    }

    @Override
    @Transactional
    public GlobalVariableDTO update(long id, GlobalVariableRequestDTO request) {
        Caller caller = requireCaller();
        GlobalVariable variable = load(id);
        Set<GlobalVariablePermission> permissions = require(variable, caller, GlobalVariablePermission.EDIT);
        // a stale form is told to reload before anything else about it is judged
        requireCurrentVersion(variable, request.version());

        List<Violation> violations = new ArrayList<>();
        requireVersionGiven(request.version(), violations);
        String name = validateName(request.name(), variable.getName(), violations);
        if (request.kind() != null && request.kind() != variable.getKind()) {
            violations.add(new Violation("kind", Code.KIND_CHANGE_NOT_ALLOWED,
                    "The kind of a global variable cannot change"));
        }
        boolean wasSecret = variable.isSecret();
        // a form that leaves the flag out keeps it, so no secret is revealed by omission
        boolean secret = request.secret() == null ? wasSecret : request.secret();
        validateSecret(variable.getKind(), secret, violations);
        String description = validateDescription(request.description(), violations);
        // a secret keeps its value unless the request gives one, and JSON null gives none
        boolean valueGiven = request.value() != null && !request.value().isNull();
        String value;
        if (variable.getKind() == GlobalVariableKind.SCRIPT) {
            value = validateScript(request, GlobalScript.fromJson(variable.getValue()).language(), violations);
        } else {
            value = secret && !valueGiven ? null : serializeValue(request.value(), violations);
        }
        validateScriptOnly(variable.getKind(), request, violations);
        if (wasSecret && !secret && !valueGiven) {
            violations.add(new Violation("value", Code.SECRET_REMOVAL_NEEDS_VALUE,
                    "Give a new value to make a secret visible again: its hidden value is never shown"));
        }
        int violationsBeforeScope = violations.size();
        ScopeSpec scope = validateScope(request.scope(), violations);
        MutableSpec mutable = validateMutable(variable.getKind(), request, variable, scope,
                violations.size() == violationsBeforeScope, violations);
        throwIfAny(violations);

        ScopeSpec oldScope = new ScopeSpec(variable.getScopeType(), Set.copyOf(variable.getScopeTargets()));
        requireChangeKeepsUsages(variable, !name.equals(variable.getName()), scope.equals(oldScope) ? null : scope,
                variable.getKind() == GlobalVariableKind.SCRIPT ? GlobalScript.fromJson(value) : null);

        long versionFrom = variable.getVersion();
        String oldValue = variable.getValue();
        String newValue;
        boolean valueChanged;
        if (!secret) {
            newValue = value;
            // a hidden value is never compared: whether it equals the new one stays unknown
            valueChanged = wasSecret || !Objects.equals(value, oldValue);
        } else if (valueGiven) {
            newValue = encryptSecret(value);
            // nor is a secret compared with what replaces it: a version that stayed the same
            // would tell that the given value is the hidden one
            valueChanged = true;
        } else {
            // a secret that is kept as it is, or a value that is hidden from now on
            newValue = wasSecret ? oldValue : encryptSecret(oldValue);
            valueChanged = false;
        }

        ObjectNode before = objectMapper.createObjectNode();
        ObjectNode after = objectMapper.createObjectNode();

        if (!name.equals(variable.getName())) {
            before.put("name", variable.getName());
            after.put("name", name);
            variable.setName(name);
        }
        if (!Objects.equals(description, variable.getDescription())) {
            before.put("description", variable.getDescription());
            after.put("description", description);
            variable.setDescription(description);
        }
        if (!scope.equals(oldScope)) {
            before.set("scope", toJson(oldScope));
            after.set("scope", toJson(scope));
            variable.setScopeType(scope.type());
            replace(variable.getScopeTargets(), scope.targets());
        }
        if (secret != wasSecret) {
            before.put("secret", wasSecret);
            after.put("secret", secret);
            variable.setSecret(secret);
        }
        if (mutable != null && mutable.busyPolicy() != variable.getBusyPolicy()) {
            before.put("busyPolicy", variable.getBusyPolicy() == null ? null : variable.getBusyPolicy().name());
            after.put("busyPolicy", mutable.busyPolicy().name());
            variable.setBusyPolicy(mutable.busyPolicy());
        }
        if (mutable != null && !mutable.ownerWorkflowId().equals(variable.getOwnerWorkflowId())) {
            before.put("ownerWorkflowId", variable.getOwnerWorkflowId());
            after.put("ownerWorkflowId", mutable.ownerWorkflowId());
            variable.setOwnerWorkflowId(mutable.ownerWorkflowId());
        }
        if (!Objects.equals(newValue, oldValue)) {
            variable.setValue(newValue);
        }

        if (!valueChanged && before.isEmpty()) {
            return mapper.toDetail(variable, permissions);
        }

        variable = saveChanged(variable, versionFrom);
        long versionTo = variable.getVersion();
        if (secret && !wasSecret) {
            // the plain values the log kept belong to a secret from now on
            changeRepository.maskValues(variable.getId(), GlobalVariableChange.SECRET_MASK);
        }
        if (valueChanged) {
            changeRepository.save(GlobalVariableChange.savedByUser(variable, GlobalVariableChange.Type.VALUE,
                    versionFrom, versionTo,
                    wasSecret || secret ? GlobalVariableChange.SECRET_MASK : oldValue,
                    secret ? GlobalVariableChange.SECRET_MASK : newValue,
                    caller.userId()));
        }
        if (!before.isEmpty()) {
            changeRepository.save(GlobalVariableChange.savedByUser(variable, GlobalVariableChange.Type.CONFIG,
                    versionFrom, versionTo, write(before), write(after), caller.userId()));
        }

        return mapper.toDetail(variable, permissions);
    }

    @Override
    @Transactional
    public void delete(long id) {
        Caller caller = requireCaller();
        GlobalVariable variable = load(id);
        require(variable, caller, GlobalVariablePermission.DELETE);

        UsageImpact impact = usageImpact(variable, true, null, null);
        if (!impact.inUse().isEmpty()) {
            throw inUse(variable, impact.inUse(), "it cannot be deleted");
        }

        changeRepository.save(GlobalVariableChange.savedByUser(variable, GlobalVariableChange.Type.DELETE,
                variable.getVersion(), null,
                variable.isSecret() ? GlobalVariableChange.SECRET_MASK : variable.getValue(), null, caller.userId()));
        repository.delete(variable);
    }

    @Override
    @Transactional(readOnly = true)
    public GlobalVariablePermissionsDTO getPermissions(long id) {
        Caller caller = requireCaller();
        GlobalVariable variable = load(id);
        requireGrantManager(variable, caller);

        return mapper.toPermissions(variable);
    }

    @Override
    @Transactional
    public GlobalVariablePermissionsDTO updatePermissions(long id, GlobalVariablePermissionsDTO.Request request) {
        Caller caller = requireCaller();
        GlobalVariable variable = load(id);
        requireGrantManager(variable, caller);
        requireCurrentVersion(variable, request.version());

        List<Violation> violations = new ArrayList<>();
        requireVersionGiven(request.version(), violations);
        Set<GlobalVariableGrant> grants = validateGrants(request.grants(), variable, violations);
        throwIfAny(violations);

        Set<GlobalVariableGrant> oldGrants = Set.copyOf(variable.getGrants());
        if (grants.equals(oldGrants)) {
            return mapper.toPermissions(variable);
        }

        long versionFrom = variable.getVersion();
        replace(variable.getGrants(), grants);
        variable = saveChanged(variable, versionFrom);

        ObjectNode before = objectMapper.createObjectNode().set("grants", toJson(oldGrants));
        ObjectNode after = objectMapper.createObjectNode().set("grants", toJson(grants));
        changeRepository.save(GlobalVariableChange.savedByUser(variable, GlobalVariableChange.Type.PERMISSIONS,
                versionFrom, variable.getVersion(), write(before), write(after), caller.userId()));

        return mapper.toPermissions(variable);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedDto<GlobalVariableChange, GlobalVariableChangeDTO> getChanges(long id, int page, int size) {
        Caller caller = requireCaller();
        GlobalVariable variable = load(id);
        require(variable, caller, GlobalVariablePermission.VIEW_USE);

        Page<GlobalVariableChange> changes = changeRepository.findByVariableIdOrderByChangedAtDescIdDesc(
                id, PageRequest.of(Math.max(page, 0), pageSize(size)));
        boolean secret = variable.isSecret();

        return new PaginatedDto<>(changes, change -> mapper.toChange(change, secret));
    }

    // not read-only: usages of sources that no longer exist are removed before the list is read
    @Override
    @Transactional
    public List<GlobalVariableUsageDTO> getUsages(long id) {
        Caller caller = requireCaller();
        GlobalVariable variable = load(id);
        require(variable, caller, GlobalVariablePermission.VIEW_USE);

        return usageService.findByVariable(id).stream().map(mapper::toUsage).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<GlobalVariablePickerItemDTO> pick(
            Long connectionId, Integer categoryId, Integer connectorId, Integer schedulerId) {
        Caller caller = requireCaller();
        PickerTarget target = pickerTarget(connectionId, categoryId, connectorId, schedulerId);

        return usableIn(target, caller).stream()
                .sorted(Comparator.comparing(GlobalVariable::getName))
                .map(mapper::toPickerItem)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<GlobalVariable> findUsable(Long connectionId, Integer categoryId) {
        Caller caller = requireCaller();
        PickerTarget target = pickerTarget(connectionId, categoryId, null, null);

        // the picker endpoint is opened by this permission, so whoever lacks it uses no variable
        if (!security.can(READ_PERMISSION)) {
            return List.of();
        }

        return usableIn(target, caller);
    }

    /** Returns the variables {@code caller} may use where {@code target} is, in no order. */
    private List<GlobalVariable> usableIn(PickerTarget target, Caller caller) {
        // an admin may use the variables of every user
        return repository.findUsableWithScopeTargets(caller.admin() ? null : caller.userId()).stream()
                .filter(variable -> variable.isInScopeOf(target.workflowId(), target.categoryIds()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<GlobalVariableValueDTO> getValues(List<Long> ids) {
        Caller caller = requireCaller();

        Set<Long> wanted = ids == null
                ? Set.of()
                : ids.stream().filter(Objects::nonNull).collect(Collectors.toCollection(LinkedHashSet::new));
        if (wanted.isEmpty()) {
            throw invalid("ids", Code.IDS_REQUIRED, "Give the ids of the variables to read");
        }
        if (wanted.size() > MAX_VALUE_IDS) {
            throw invalid("ids", Code.TOO_MANY_IDS, "At most " + MAX_VALUE_IDS + " ids can be read in one call");
        }

        // unknown ids and variables the user may not view are simply left out
        List<GlobalVariable> variables = repository.findViewableByIds(wanted, caller.admin() ? null : caller.userId());
        for (GlobalVariable variable : variables) {
            if (variable.getKind() == GlobalVariableKind.SCRIPT) {
                throw invalid("ids", Code.SCRIPT_HAS_NO_VALUE,
                        "Global variable '%s' is a script and has no stored value".formatted(variable.getName()));
            }
        }

        return variables.stream()
                .sorted(Comparator.comparing(GlobalVariable::getId))
                .map(variable -> mapper.toValue(variable, beingUpdatedBy(variable)))
                .toList();
    }

    /**
     * Returns the run that updates a mutable variable now: a run of its owner workflow, the only
     * one that writes it. A test run writes its own copy and does not count.
     *
     * @return the run, or {@code null} for another kind, a variable without an owner workflow or
     *         an owner workflow that does not run
     */
    private GlobalVariableDTO.BeingUpdatedBy beingUpdatedBy(GlobalVariable variable) {
        if (variable.getKind() != GlobalVariableKind.MUTABLE || variable.getOwnerWorkflowId() == null) {
            return null;
        }
        return runGate.holdOf(variable.getOwnerWorkflowId())
                .map(hold -> new GlobalVariableDTO.BeingUpdatedBy(hold.workflowId(), hold.executionId(), hold.startedAt()))
                .orElse(null);
    }

    // not read-only: usages of sources that no longer exist are removed before they are read
    @Override
    @Transactional
    public GlobalVariableImpactDTO impact(long id, GlobalVariableImpactDTO.Request request) {
        Caller caller = requireCaller();
        GlobalVariable variable = load(id);
        boolean delete = Boolean.TRUE.equals(request.delete());
        require(variable, caller, delete ? GlobalVariablePermission.DELETE : GlobalVariablePermission.EDIT);

        if (delete) {
            return new GlobalVariableImpactDTO(usageImpact(variable, true, null, null).all(), List.of());
        }

        boolean renamed = request.name() != null && !request.name().equals(variable.getName());
        ScopeSpec newScope = null;
        if (request.scope() != null) {
            List<Violation> violations = new ArrayList<>();
            ScopeSpec asked = validateScope(request.scope(), violations);
            throwIfAny(violations);

            ScopeSpec current = new ScopeSpec(variable.getScopeType(), Set.copyOf(variable.getScopeTargets()));
            newScope = asked.equals(current) ? null : asked;
        }

        UsageImpact impact = usageImpact(variable, renamed, newScope, askedScript(variable, request.script()));
        return new GlobalVariableImpactDTO(impact.all(), impact.warnings());
    }

    /**
     * The script an impact preview asks about: the form's parameters in the saved language and
     * code, for only the parameters can break a caller. {@code null} for another kind or a form
     * that sends no script. A parameter the save would refuse is taken as given; the save itself
     * reports it.
     */
    private static GlobalScript askedScript(GlobalVariable variable, GlobalVariableRequestDTO.Script asked) {
        if (variable.getKind() != GlobalVariableKind.SCRIPT || asked == null) {
            return null;
        }

        GlobalScript saved = GlobalScript.fromJson(variable.getValue());
        return new GlobalScript(saved.language(), saved.code(), toParameters(asked.parameters(), new ArrayList<>()));
    }

    @Override
    @Transactional
    public GlobalVariableDTO restore(long id, long changeId, GlobalVariableRestoreRequestDTO request) {
        Caller caller = requireCaller();
        GlobalVariable variable = load(id);
        Set<GlobalVariablePermission> permissions = require(variable, caller, GlobalVariablePermission.EDIT);
        requireCurrentVersion(variable, request.version());

        List<Violation> violations = new ArrayList<>();
        requireVersionGiven(request.version(), violations);
        throwIfAny(violations);

        // an entry of another variable is as good as none
        GlobalVariableChange change = changeRepository.findById(changeId)
                .filter(found -> Objects.equals(found.getVariableId(), variable.getId()))
                .orElseThrow(() -> new GeneralServiceException(HttpStatus.NOT_FOUND, CHANGE_NOT_FOUND,
                        "Change %d of global variable %d does not exist".formatted(changeId, id)));
        if (variable.isSecret()) {
            throw invalid("changeId", Code.NOT_RESTORABLE,
                    "A secret cannot be set back to an earlier value: the change log keeps none of its values");
        }
        if (!GlobalVariableMapper.isRestorable(change)) {
            throw invalid("changeId", Code.NOT_RESTORABLE, "This change log entry holds no value to restore");
        }

        String oldValue = variable.getValue();
        String restored = change.getNewValue();
        if (Objects.equals(restored, oldValue)) {
            return mapper.toDetail(variable, permissions);
        }
        if (variable.getKind() == GlobalVariableKind.SCRIPT) {
            // an earlier definition may have declared parameters today's callers do not fit
            requireChangeKeepsUsages(variable, false, null, GlobalScript.fromJson(restored));
        }

        long versionFrom = variable.getVersion();
        variable.setValue(restored);
        GlobalVariable saved = saveChanged(variable, versionFrom);
        changeRepository.save(GlobalVariableChange.savedByUser(saved, GlobalVariableChange.Type.RESTORE,
                versionFrom, saved.getVersion(), oldValue, restored, caller.userId()));

        return mapper.toDetail(saved, permissions);
    }

    @Override
    @Transactional
    public GlobalVariableDTO reset(long id) {
        Caller caller = requireCaller();
        GlobalVariable variable = load(id);
        Set<GlobalVariablePermission> permissions = require(variable, caller, GlobalVariablePermission.EDIT);
        if (variable.getKind() != GlobalVariableKind.MUTABLE) {
            throw invalid("id", Code.NOT_MUTABLE, "Global variable '%s' is a %s and has no current value to reset"
                    .formatted(variable.getName(), variable.getKind()));
        }

        String oldValue = variable.getCurrentValue();
        // one statement, so a run that writes at the same time comes either before or after it
        repository.resetCurrentValue(id, new Date(), caller.userId());
        GlobalVariable reset = load(id);

        changeRepository.save(GlobalVariableChange.savedByUser(reset, GlobalVariableChange.Type.RESET,
                reset.getVersion(), reset.getVersion(), oldValue, reset.getCurrentValue(), caller.userId()));

        return mapper.toDetail(reset, permissions);
    }

    @Override
    public GlobalScriptTestDTO testScript(GlobalScriptTestDTO.Request request) {
        requireCaller();

        String language = request.language();
        if (UNTESTABLE_LANGUAGES.contains(language)) {
            return GlobalScriptTestDTO.failed(new GlobalScriptTestDTO.Problem("VALIDATION_UNAVAILABLE",
                    "Scripts in '%s' cannot be checked or tested yet".formatted(language), null, null), null);
        }

        List<Violation> violations = new ArrayList<>();
        GlobalScript script = new GlobalScript(language, request.code(), toParameters(request.parameters(), violations));
        violations.addAll(script.check());
        if (!violations.isEmpty()) {
            Violation first = violations.get(0);
            GlobalScript.SyntaxError syntax = first.code() == Code.SCRIPT_SYNTAX
                    ? script.syntaxError().orElse(null)
                    : null;
            return GlobalScriptTestDTO.failed(syntax == null
                    ? new GlobalScriptTestDTO.Problem(first.code().name(), first.message(), null, null)
                    : new GlobalScriptTestDTO.Problem(first.code().name(), syntax.message(), syntax.line(),
                            syntax.column()), null);
        }

        List<JsonNode> arguments = request.testArguments() == null ? List.of() : request.testArguments();
        for (int i = arguments.size(); i < script.parameters().size(); i++) {
            GlobalScript.Parameter parameter = script.parameters().get(i);
            if (parameter.required()) {
                return GlobalScriptTestDTO.failed(new GlobalScriptTestDTO.Problem("MISSING_ARGUMENT",
                        "Parameter '%s' is required: give it a test argument".formatted(parameter.name()),
                        null, null), null);
            }
        }

        return callScript(script, request.name() == null ? "script" : request.name(), arguments);
    }

    /** Calls a checked script once, the way an enhancement that imports it calls it. */
    private GlobalScriptTestDTO callScript(GlobalScript script, String name, List<JsonNode> arguments) {
        List<Object> values = arguments.stream()
                .map(argument -> argument == null ? null : objectMapper.convertValue(argument, Object.class))
                .collect(Collectors.toCollection(ArrayList::new));
        String code = script.functionSource(TESTED_FUNCTION, name)
                + TESTED_FUNCTION + ".apply(null, " + TEST_ARGUMENTS + ");";

        long start = System.nanoTime();
        try {
            Object result = GlobalScript.runWithin(scriptTimeLimit, "The script",
                    () -> nashornEngine.execute(code, Map.of(TEST_ARGUMENTS, values)));
            return GlobalScriptTestDTO.passed(objectMapper.valueToTree(result), elapsedMs(start));
        } catch (GlobalScript.TimeLimitExceeded e) {
            return GlobalScriptTestDTO.failed(
                    new GlobalScriptTestDTO.Problem("SCRIPT_TIMEOUT", e.getMessage(), null, null), elapsedMs(start));
        } catch (ScriptExecutionException | InvalidScriptException e) {
            return GlobalScriptTestDTO.failed(
                    new GlobalScriptTestDTO.Problem("SCRIPT_RUNTIME", e.getMessage(), null, null), elapsedMs(start));
        }
    }

    private static long elapsedMs(long startNanos) {
        return Duration.ofNanos(System.nanoTime() - startNanos).toMillis();
    }

    /**
     * What the picker is opened for, as the scope rule sees it.
     *
     * @param workflowId  id of the workflow, or {@link #NO_WORKFLOW}
     * @param categoryIds the category of the workflow and every category above it
     */
    private record PickerTarget(long workflowId, Set<Long> categoryIds) {
    }

    /**
     * Works out whose variables the picker lists. A saved workflow gets the variables in its
     * scope, and so does a notification through the workflow of its schedule; a workflow that is
     * not saved yet is matched by its category alone; a connector, shared by workflows of any
     * category, gets only the variables open to all workflows, as does a request that names
     * nothing.
     */
    private PickerTarget pickerTarget(Long connectionId, Integer categoryId, Integer connectorId, Integer schedulerId) {
        long given = Stream.of(connectionId, categoryId, connectorId, schedulerId).filter(Objects::nonNull).count();
        if (given > 1) {
            throw invalid("connectionId", Code.PICKER_TARGET_AMBIGUOUS,
                    "Give only one of connectionId, categoryId, connectorId and schedulerId");
        }

        Long workflowId = connectionId;
        if (schedulerId != null) {
            workflowId = schedulerRepository.findById(schedulerId)
                    .map(scheduler -> scheduler.getConnection().getId())
                    .orElseThrow(() -> new GeneralServiceException(HttpStatus.NOT_FOUND, ExceptionConstant.SCHEDULER_NOT_FOUND,
                            "Schedule " + schedulerId + " does not exist"));
        }

        if (workflowId != null) {
            long id = workflowId;
            Connection workflow = connectionRepository.findById(id)
                    .orElseThrow(() -> new GeneralServiceException(HttpStatus.NOT_FOUND,
                            ExceptionConstant.CONNECTION_NOT_FOUND, "Workflow " + id + " does not exist"));

            return new PickerTarget(id, scopeResolver.categoryChainOf(workflow.getCategoryId()));
        }

        return new PickerTarget(NO_WORKFLOW, categoryId == null ? Set.of() : scopeResolver.categoryChainOf(categoryId));
    }

    private static GlobalVariableValidationException invalid(String field, Code code, String message) {
        return new GlobalVariableValidationException(List.of(new Violation(field, code, message)));
    }

    // ------------------------------------------------------------------ usages

    /**
     * Refuses a rename, a new scope or new script parameters that would break what uses the
     * variable. A reference holds the name, so a used variable keeps its name; a workflow, a
     * connector or a notification that uses the variable stays in its scope; and the calls made
     * to a used script keep fitting its parameters.
     *
     * @param renamed   whether the request changes the name
     * @param newScope  the scope the request asks for, or {@code null} if it keeps the scope
     * @param newScript the script definition the request asks for, or {@code null} for a
     *                  variable that is no script
     */
    private void requireChangeKeepsUsages(GlobalVariable variable, boolean renamed, ScopeSpec newScope,
            GlobalScript newScript) {
        UsageImpact impact = usageImpact(variable, renamed, newScope, newScript);

        if (!impact.inUse().isEmpty()) {
            throw inUse(variable, impact.inUse(), "it cannot be renamed");
        }

        if (!impact.outOfScope().isEmpty()) {
            throw new GlobalVariableConflictException(GlobalVariableConflictException.Code.SCOPE_NARROWING,
                    "The new scope of global variable '%s' leaves out workflows, connectors or notifications that use it"
                            .formatted(variable.getName()),
                    variable.getVersion(), impact.outOfScope());
        }

        if (!impact.parameterBreaking().isEmpty()) {
            throw new GlobalVariableConflictException(GlobalVariableConflictException.Code.PARAMETER_BREAKING,
                    "Global variable '%s' is called by enhancements, and %s; calls pass arguments by position, so "
                            .formatted(variable.getName(), impact.breakingChange())
                            + "a used script keeps its parameters in order and a new one needs a default",
                    variable.getVersion(), impact.parameterBreaking());
        }
    }

    /**
     * What stands in the way of a change: the usages that need the name of the variable, the
     * usages a new scope leaves out, and the callers of a script whose new parameters break
     * their calls; and the callers the change reaches without blocking it.
     *
     * @param breakingChange what breaks the calls, as a clause; {@code null} when nothing does
     */
    private record UsageImpact(List<Blocking> inUse, List<Blocking> outOfScope, List<Blocking> parameterBreaking,
                               String breakingChange, List<Blocking> warnings) {

        static final UsageImpact NONE = new UsageImpact(List.of(), List.of(), List.of(), null, List.of());

        List<Blocking> all() {
            List<Blocking> all = new ArrayList<>(inUse);
            all.addAll(outOfScope);
            all.addAll(parameterBreaking);
            return all;
        }
    }

    /**
     * Works out what a change would break, without changing anything.
     *
     * @param losesName whether the change takes the name away: a rename or a delete
     * @param newScope  the scope the change asks for, or {@code null} if it keeps the scope
     * @param newScript the script definition the change asks for, or {@code null} if it keeps
     *                  the script or the variable is no script
     */
    private UsageImpact usageImpact(GlobalVariable variable, boolean losesName, ScopeSpec newScope,
            GlobalScript newScript) {
        GlobalScript oldScript = newScript == null ? null : GlobalScript.fromJson(variable.getValue());
        Optional<GlobalScript.BreakingChange> breaking =
                newScript == null ? Optional.empty() : oldScript.breakingChangeTo(newScript);
        boolean signatureChanged = newScript != null && oldScript.changesSignature(newScript);
        if (!losesName && newScope == null && !signatureChanged) {
            return UsageImpact.NONE;
        }

        List<GlobalVariableUsage> usages = usageService.findByVariable(variable.getId());
        if (usages.isEmpty()) {
            return UsageImpact.NONE;
        }

        List<Blocking> inUse = losesName ? toBlocking(usages, REASON_IN_USE) : List.of();
        List<Blocking> outOfScope = List.of();
        if (newScope != null) {
            // a source holds several usages: whether the scope keeps it in is worked out once
            Map<UsageSource, Boolean> inNewScope = new HashMap<>();
            outOfScope = toBlocking(usages.stream()
                    .filter(usage -> !inNewScope.computeIfAbsent(
                            new UsageSource(usage.getSourceType(), usage.getSourceId()),
                            source -> covers(newScope, source)))
                    .toList(), REASON_OUT_OF_SCOPE);
        }

        // every usage of a script is a caller: a script is used only by importing it
        List<Blocking> parameterBreaking = breaking
                .map(change -> toBlocking(usages, REASON_PARAMETER_BREAKING, change.parameter()))
                .orElse(List.of());
        List<Blocking> warnings = signatureChanged && breaking.isEmpty()
                ? toBlocking(usages, WARNING_CALLS_NOT_CHECKED)
                : List.of();

        return new UsageImpact(inUse, outOfScope, parameterBreaking,
                breaking.map(GlobalScript.BreakingChange::change).orElse(null), warnings);
    }

    /** What holds usages: a workflow, a connector or a notification, by its id. */
    private record UsageSource(GlobalVariableUsage.SourceType type, long id) {
    }

    /**
     * Tells whether a scope lets a source go on using the variable. A workflow must be in the
     * scope; a notification belongs to the workflow its schedule runs and follows it; a
     * connector is shared by every workflow, so only a scope open to all keeps it.
     */
    private boolean covers(ScopeSpec scope, UsageSource source) {
        return switch (source.type()) {
            case WORKFLOW -> covers(scope, source.id());
            case CONNECTOR -> scope.type() == GlobalVariableScopeType.ALL;
            // a notification that is gone uses nothing
            case NOTIFICATION -> usageService.workflowOfNotification(source.id())
                    .map(workflowId -> covers(scope, workflowId))
                    .orElse(true);
            // a script variable is not bound to a workflow
            case SCRIPT_VARIABLE -> true;
        };
    }

    private boolean covers(ScopeSpec scope, long connectionId) {
        Integer categoryId = connectionRepository.findById(connectionId)
                .map(Connection::getCategoryId)
                .orElse(null);

        return GlobalVariable.covers(scope.type(), scope.targets(), connectionId,
                scopeResolver.categoryChainOf(categoryId));
    }

    private GlobalVariableConflictException inUse(GlobalVariable variable, List<Blocking> blocking, String consequence) {
        return new GlobalVariableConflictException(GlobalVariableConflictException.Code.IN_USE,
                "Global variable '%s' is used, so %s".formatted(variable.getName(), consequence),
                variable.getVersion(), blocking);
    }

    /**
     * Describes usages as what blocks a change, or as what it reaches without blocking it.
     *
     * @param reason why each of them blocks, as the impact preview names it: IN_USE or
     *               OUT_OF_SCOPE; or the warning, CALLS_IN_CODE_NOT_CHECKED
     */
    private List<Blocking> toBlocking(List<GlobalVariableUsage> usages, String reason) {
        return toBlocking(usages, reason, null);
    }

    /**
     * Describes usages as what blocks a change of a script parameter.
     *
     * @param parameter the parameter whose change breaks the calls, {@code null} for another reason
     */
    private List<Blocking> toBlocking(List<GlobalVariableUsage> usages, String reason, String parameter) {
        return usages.stream()
                .map(mapper::toUsage)
                .map(usage -> new Blocking(
                        usage.sourceType().name(), usage.sourceId(), usage.sourceTitle(),
                        usage.elementType() == null ? null : usage.elementType().name(), usage.elementLabel(),
                        usage.color(), usage.index(), usage.field(), reason, parameter))
                .toList();
    }

    // ------------------------------------------------------------------ access

    private Caller requireCaller() {
        return security.caller().orElseThrow(() -> new GeneralServiceException(
                HttpStatus.UNAUTHORIZED, UNAUTHORIZED, "No authenticated user"));
    }

    private GlobalVariable load(long id) {
        return repository.findById(id).orElseThrow(() -> new GeneralServiceException(
                HttpStatus.NOT_FOUND, NOT_FOUND, "Global variable " + id + " does not exist"));
    }

    private Set<GlobalVariablePermission> require(
            GlobalVariable variable, Caller caller, GlobalVariablePermission needed) {
        Set<GlobalVariablePermission> permissions = security.permissionsOn(variable, caller);
        if (!permissions.contains(needed)) {
            throw new GeneralServiceException(HttpStatus.FORBIDDEN, ExceptionConstant.FORBIDDEN,
                    "You have no %s permission on global variable '%s'".formatted(needed, variable.getName()));
        }

        return permissions;
    }

    private void requireGrantManager(GlobalVariable variable, Caller caller) {
        if (!security.canManageGrants(variable, caller)) {
            throw new GeneralServiceException(HttpStatus.FORBIDDEN, ExceptionConstant.FORBIDDEN,
                    "Only the owner of global variable '%s' or an admin manages its permissions"
                            .formatted(variable.getName()));
        }
    }

    // ------------------------------------------------------------------ version

    private void requireCurrentVersion(GlobalVariable variable, Long version) {
        if (version != null && version != variable.getVersion()) {
            throw conflict(variable);
        }
    }

    private static void requireVersionGiven(Long version, List<Violation> violations) {
        if (version == null) {
            violations.add(new Violation("version", Code.VERSION_REQUIRED,
                    "The version the form loaded is required"));
        }
    }

    /**
     * Writes the changed variable, which raises its version. A change another transaction
     * committed since this one loaded the variable is the same conflict as a stale form.
     */
    private GlobalVariable saveChanged(GlobalVariable variable, long versionFrom) {
        try {
            return repository.saveAndFlush(variable);
        } catch (ObjectOptimisticLockingFailureException e) {
            throw new GlobalVariableConflictException(GlobalVariableConflictException.Code.VERSION_CONFLICT,
                    "Global variable '%s' was changed meanwhile, reload to see the new value"
                            .formatted(variable.getName()),
                    versionFrom);
        } catch (DataIntegrityViolationException e) {
            // another request took the new name between the check and the update
            throw new GlobalVariableValidationException(List.of(nameTaken(variable.getName())));
        }
    }

    private GlobalVariableConflictException conflict(GlobalVariable variable) {
        String who = mapper.userName(variable.getUpdatedBy()).orElse("another user");
        String when = variable.getUpdatedAt() == null ? "" : " at " + variable.getUpdatedAt().toInstant();

        return new GlobalVariableConflictException(GlobalVariableConflictException.Code.VERSION_CONFLICT,
                "Changed by %s%s, reload to see the new value".formatted(who, when), variable.getVersion());
    }

    // ------------------------------------------------------------------ validation

    private String validateName(String name, String currentName, List<Violation> violations) {
        if (name == null || !NAME.matcher(name).matches()) {
            violations.add(new Violation("name", Code.NAME_INVALID,
                    "A name has 1 to 64 letters, digits or '_' and starts with a letter"));
            return name;
        }

        // the unique key ignores case, so does the check; a change of case only is a rename
        boolean sameVariable = currentName != null && currentName.equalsIgnoreCase(name);
        if (!sameVariable && repository.existsByNameIgnoreCase(name)) {
            violations.add(nameTaken(name));
        }

        return name;
    }

    private static Violation nameTaken(String name) {
        return new Violation("name", Code.NAME_TAKEN, "Name '" + name + "' is already taken");
    }

    private static void validateKindOnCreate(GlobalVariableKind kind, List<Violation> violations) {
        if (kind == null) {
            violations.add(new Violation("kind", Code.KIND_REQUIRED, "The kind is required"));
        }
    }

    private static void validateSecret(GlobalVariableKind kind, boolean secret, List<Violation> violations) {
        if (secret && kind == GlobalVariableKind.MUTABLE) {
            violations.add(new Violation("secret", Code.SECRET_NOT_ALLOWED,
                    "A mutable variable cannot be a secret: runs write its value"));
        } else if (secret && kind == GlobalVariableKind.SCRIPT) {
            violations.add(new Violation("secret", Code.SECRET_NOT_ALLOWED,
                    "A script variable cannot be a secret: it holds code, not a value"));
        }
    }

    /**
     * Checks the script of a script variable and returns the JSON text it is stored as.
     *
     * @param savedLanguage the language of the saved script on an update, which cannot change;
     *                      {@code null} on a create
     * @return the definition as JSON text, or {@code null} if the request has no script
     */
    private String validateScript(GlobalVariableRequestDTO request, String savedLanguage, List<Violation> violations) {
        if (request.value() != null && !request.value().isNull()) {
            violations.add(new Violation("value", Code.SCRIPT_HAS_NO_VALUE,
                    "A script variable has no value: send its script instead"));
        }
        GlobalVariableRequestDTO.Script requested = request.script();
        if (requested == null) {
            violations.add(new Violation("script", Code.SCRIPT_REQUIRED,
                    "A script variable is saved with its script: language, code and parameters"));
            return null;
        }
        if (savedLanguage != null && !savedLanguage.equals(requested.language())) {
            violations.add(new Violation("script.language", Code.LANGUAGE_CHANGE_NOT_ALLOWED,
                    "The language of a script variable cannot change"));
            return null;
        }

        GlobalScript script = new GlobalScript(
                requested.language(), requested.code(), toParameters(requested.parameters(), violations));
        violations.addAll(script.check());

        String text = script.toJson();
        if (text.getBytes(StandardCharsets.UTF_8).length > maxScriptBytes) {
            violations.add(new Violation("script.code", Code.VALUE_TOO_LARGE,
                    "A script has at most " + maxScriptBytes + " bytes"));
        }

        return text;
    }

    private static List<GlobalScript.Parameter> toParameters(
            List<GlobalVariableRequestDTO.Parameter> requested, List<Violation> violations) {
        List<GlobalScript.Parameter> parameters = new ArrayList<>();
        List<GlobalVariableRequestDTO.Parameter> entries = requested == null ? List.of() : requested;
        for (int i = 0; i < entries.size(); i++) {
            parameters.add(toParameter(entries.get(i), "script.parameters[" + i + "]", violations));
        }

        return parameters;
    }

    /**
     * Works out one declared parameter. A parameter that does not say whether it is required is
     * required unless it has a default; a required one cannot have a default.
     */
    private static GlobalScript.Parameter toParameter(
            GlobalVariableRequestDTO.Parameter requested, String field, List<Violation> violations) {
        if (requested == null) {
            // the script's own check reports the missing name
            return new GlobalScript.Parameter(null, null, true, null);
        }

        JsonNode defaultValue = requested.defaultValue();
        boolean hasDefault = defaultValue != null && !defaultValue.isNull();
        boolean required = requested.required() != null ? requested.required() : defaultValue == null;
        if (required && hasDefault) {
            violations.add(new Violation(field + ".default", Code.PARAMETER_INVALID,
                    "A required parameter has no default: a call always passes it"));
        }

        return new GlobalScript.Parameter(requested.name(), requested.description(), required, defaultValue);
    }

    private static void validateScriptOnly(
            GlobalVariableKind kind, GlobalVariableRequestDTO request, List<Violation> violations) {
        if (kind != GlobalVariableKind.SCRIPT && request.script() != null) {
            violations.add(new Violation("script", Code.SCRIPT_ONLY, "Only a script variable has a script"));
        }
    }

    /**
     * Checks the fields only a mutable variable has, and works out what they become.
     *
     * @param kind       kind of the variable
     * @param current    the saved variable on an update, whose fields a request that leaves
     *                   them out keeps; {@code null} on a create
     * @param scope      the scope the request asks for, which must hold the owner workflow
     * @param scopeValid whether {@code scope} passed its checks; if not, whether it holds the
     *                   owner workflow is not judged
     * @return the busy policy and the owner workflow; {@code null} for the other kinds
     */
    private MutableSpec validateMutable(GlobalVariableKind kind, GlobalVariableRequestDTO request,
            GlobalVariable current, ScopeSpec scope, boolean scopeValid, List<Violation> violations) {
        if (kind != GlobalVariableKind.MUTABLE) {
            if (request.busyPolicy() != null) {
                violations.add(new Violation("busyPolicy", Code.MUTABLE_ONLY,
                        "Only a mutable variable has a busy policy"));
            }
            if (request.ownerWorkflowId() != null) {
                violations.add(new Violation("ownerWorkflowId", Code.MUTABLE_ONLY,
                        "Only a mutable variable has an owner workflow"));
            }
            return null;
        }

        GlobalVariableBusyPolicy busyPolicy = request.busyPolicy() != null ? request.busyPolicy()
                : current == null || current.getBusyPolicy() == null ? GlobalVariableBusyPolicy.QUEUE
                : current.getBusyPolicy();
        // the saved owner is null once its workflow is deleted, and then a new one is needed
        Long ownerWorkflowId = request.ownerWorkflowId() != null ? request.ownerWorkflowId()
                : current == null ? null : current.getOwnerWorkflowId();

        if (ownerWorkflowId == null) {
            violations.add(new Violation("ownerWorkflowId", Code.OWNER_WORKFLOW_REQUIRED,
                    "Choose the workflow whose runs may write the variable"));
        } else if (!connectionRepository.existsById(ownerWorkflowId)) {
            violations.add(new Violation("ownerWorkflowId", Code.OWNER_WORKFLOW_INVALID,
                    "Workflow " + ownerWorkflowId + " does not exist"));
        } else if (scopeValid && !covers(scope, ownerWorkflowId)) {
            violations.add(new Violation("ownerWorkflowId", Code.OWNER_WORKFLOW_INVALID,
                    "Workflow " + ownerWorkflowId + " is outside the scope of the variable"));
        }

        return new MutableSpec(busyPolicy, ownerWorkflowId);
    }

    private static String validateDescription(String description, List<Violation> violations) {
        if (description != null && description.length() > DESCRIPTION_MAX_LENGTH) {
            violations.add(new Violation("description", Code.DESCRIPTION_TOO_LONG,
                    "A description has at most " + DESCRIPTION_MAX_LENGTH + " characters"));
        }

        return description;
    }

    /**
     * Returns what a secret stores for a value given as JSON text: the encrypted text, or
     * {@code null} for no value, so {@code hasValue} can tell a secret without one.
     */
    private String encryptSecret(String jsonValue) {
        return jsonValue == null || JSON_NULL.equals(jsonValue) ? null : cipher.encrypt(jsonValue);
    }

    /** Returns the value as JSON text; a value that is left out is JSON null. */
    private String serializeValue(JsonNode value, List<Violation> violations) {
        String text = write(value == null ? NullNode.getInstance() : value);
        if (text.getBytes(StandardCharsets.UTF_8).length > maxValueBytes) {
            violations.add(new Violation("value", Code.VALUE_TOO_LARGE,
                    "A value has at most " + maxValueBytes + " bytes as JSON text"));
        }

        return text;
    }

    private ScopeSpec validateScope(GlobalVariableRequestDTO.Scope scope, List<Violation> violations) {
        if (scope == null || scope.type() == null) {
            violations.add(new Violation("scope", Code.SCOPE_REQUIRED,
                    "The scope is required: ALL, CATEGORIES or WORKFLOWS"));
            return new ScopeSpec(GlobalVariableScopeType.ALL, Set.of());
        }

        return switch (scope.type()) {
            case ALL -> new ScopeSpec(GlobalVariableScopeType.ALL, Set.of());
            case CATEGORIES -> new ScopeSpec(GlobalVariableScopeType.CATEGORIES,
                    categoryTargets(scope.categoryIds(), violations));
            case WORKFLOWS -> new ScopeSpec(GlobalVariableScopeType.WORKFLOWS,
                    workflowTargets(scope.workflowIds(), violations));
        };
    }

    private Set<GlobalVariableScopeTarget> categoryTargets(List<Long> ids, List<Violation> violations) {
        Set<GlobalVariableScopeTarget> targets = new HashSet<>();
        if (ids == null || ids.isEmpty()) {
            violations.add(new Violation("scope", Code.SCOPE_INVALID, "Choose at least one category"));
            return targets;
        }

        for (Long id : ids) {
            boolean exists = id != null && id > 0 && id <= Integer.MAX_VALUE
                    && categoryRepository.existsById(id.intValue());
            if (!exists) {
                violations.add(new Violation("scope", Code.SCOPE_INVALID, "Category " + id + " does not exist"));
            } else {
                targets.add(GlobalVariableScopeTarget.category(id));
            }
        }

        return targets;
    }

    private Set<GlobalVariableScopeTarget> workflowTargets(List<Long> ids, List<Violation> violations) {
        Set<GlobalVariableScopeTarget> targets = new HashSet<>();
        if (ids == null || ids.isEmpty()) {
            violations.add(new Violation("scope", Code.SCOPE_INVALID, "Choose at least one workflow"));
            return targets;
        }

        for (Long id : ids) {
            boolean exists = id != null && connectionRepository.existsById(id);
            if (!exists) {
                violations.add(new Violation("scope", Code.SCOPE_INVALID, "Workflow " + id + " does not exist"));
            } else {
                targets.add(GlobalVariableScopeTarget.workflow(id));
            }
        }

        return targets;
    }

    private Set<GlobalVariableGrant> validateGrants(
            List<GrantRequest> requested, GlobalVariable variable, List<Violation> violations) {
        Set<GlobalVariableGrant> grants = new HashSet<>();
        Set<Integer> seen = new HashSet<>();

        List<GrantRequest> entries = requested == null ? List.of() : requested;
        for (int i = 0; i < entries.size(); i++) {
            GrantRequest entry = entries.get(i);
            String field = "grants[" + i + "]";

            if (entry == null || entry.userId() == null) {
                violations.add(new Violation(field + ".userId", Code.GRANT_INVALID, "A grant names a user"));
            } else if (entry.permissions() == null || entry.permissions().isEmpty()
                    || entry.permissions().stream().anyMatch(Objects::isNull)) {
                violations.add(new Violation(field + ".permissions", Code.GRANT_INVALID,
                        "A grant holds at least one of VIEW_USE, EDIT and DELETE"));
            } else if (entry.userId().equals(variable.getOwnerUserId())) {
                violations.add(new Violation(field + ".userId", Code.GRANT_INVALID,
                        "The owner already holds every permission"));
            } else if (!seen.add(entry.userId())) {
                violations.add(new Violation(field + ".userId", Code.GRANT_INVALID,
                        "User " + entry.userId() + " is listed twice"));
            } else if (!userRepository.existsById(entry.userId())) {
                violations.add(new Violation(field + ".userId", Code.GRANT_INVALID,
                        "User " + entry.userId() + " does not exist"));
            } else {
                entry.permissions().forEach(
                        permission -> grants.add(new GlobalVariableGrant(entry.userId(), permission)));
            }
        }

        return grants;
    }

    private static void throwIfAny(List<Violation> violations) {
        if (!violations.isEmpty()) {
            throw new GlobalVariableValidationException(violations);
        }
    }

    // ------------------------------------------------------------------ helpers

    /** What a mutable variable is saved with: the busy policy and the owner workflow. */
    private record MutableSpec(GlobalVariableBusyPolicy busyPolicy, Long ownerWorkflowId) {
    }

    /** Scope of a variable as one comparable value. */
    private record ScopeSpec(GlobalVariableScopeType type, Set<GlobalVariableScopeTarget> targets) {
    }

    /** Makes {@code current} hold exactly {@code wanted}, touching only the rows that differ. */
    private static <T> void replace(Set<T> current, Set<T> wanted) {
        current.retainAll(wanted);
        current.addAll(wanted);
    }

    private ObjectNode toJson(ScopeSpec scope) {
        ObjectNode json = objectMapper.createObjectNode();
        json.put("type", scope.type().name());
        ArrayNode categoryIds = json.putArray("categoryIds");
        ArrayNode workflowIds = json.putArray("workflowIds");

        scope.targets().stream()
                .sorted(Comparator.comparing(GlobalVariableScopeTarget::getTargetId))
                .forEach(target -> {
                    boolean category = target.getTargetType() == GlobalVariableScopeTarget.Type.CATEGORY;
                    (category ? categoryIds : workflowIds).add(target.getTargetId());
                });

        return json;
    }

    private ArrayNode toJson(Set<GlobalVariableGrant> grants) {
        Map<Integer, Set<GlobalVariablePermission>> byUser = new TreeMap<>();
        for (GlobalVariableGrant grant : grants) {
            byUser.computeIfAbsent(grant.getUserId(), id -> EnumSet.noneOf(GlobalVariablePermission.class))
                    .add(grant.getPermission());
        }

        ArrayNode json = objectMapper.createArrayNode();
        byUser.forEach((userId, permissions) -> {
            ObjectNode entry = json.addObject();
            entry.put("userId", userId);
            ArrayNode names = entry.putArray("permissions");
            permissions.forEach(permission -> names.add(permission.name()));
        });

        return json;
    }

    private String write(JsonNode json) {
        try {
            return objectMapper.writeValueAsString(json);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("A JSON tree could not be written as text", e);
        }
    }

    private static String toLikePattern(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }

        // '!' is the escape character of the query, so '%' and '_' are searched as typed
        String escaped = search.strip().toLowerCase(Locale.ROOT)
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");

        return "%" + escaped + "%";
    }

    private static Pageable toPageable(int page, int size, String sort) {
        String property = DEFAULT_SORT;
        Sort.Direction direction = Sort.Direction.ASC;

        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            if (SORTABLE.contains(parts[0].strip())) {
                property = parts[0].strip();
            }
            if (parts.length > 1 && "desc".equalsIgnoreCase(parts[1].strip())) {
                direction = Sort.Direction.DESC;
            }
        }

        // the id makes the order stable when the sorted property repeats
        return PageRequest.of(Math.max(page, 0), pageSize(size), Sort.by(direction, property).and(Sort.by("id")));
    }

    private static int pageSize(int size) {
        return size <= 0 ? DEFAULT_PAGE_SIZE : Math.min(size, MAX_PAGE_SIZE);
    }
}
