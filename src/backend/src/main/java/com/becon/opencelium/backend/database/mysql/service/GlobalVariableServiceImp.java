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
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.exception.GlobalVariableConflictException;
import com.becon.opencelium.backend.exception.GlobalVariableConflictException.Blocking;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Code;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Violation;
import com.becon.opencelium.backend.mapper.mysql.GlobalVariableMapper;
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
import com.becon.opencelium.backend.security.GlobalVariableSecurity;
import com.becon.opencelium.backend.security.GlobalVariableSecurity.Caller;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
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
    // the component permission that opens the picker, see GlobalVariableController
    private static final String READ_PERMISSION = "READ";

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
    private final int maxValueBytes;

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
            @Value("${opencelium.global-variable.max-value-bytes:65536}") int maxValueBytes) {
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
        this.maxValueBytes = maxValueBytes;
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
                variable, security.permissionsOn(variable, caller), usageCounts.getOrDefault(variable.getId(), 0L)));
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
        validateSecret(request.secret(), violations);
        String description = validateDescription(request.description(), violations);
        String value = serializeValue(request.value(), violations);
        ScopeSpec scope = validateScope(request.scope(), violations);
        throwIfAny(violations);

        GlobalVariable variable = new GlobalVariable();
        variable.setName(name);
        variable.setKind(request.kind());
        variable.setDescription(description);
        variable.setValue(value);
        variable.setScopeType(scope.type());
        variable.setScopeTargets(new HashSet<>(scope.targets()));
        variable.setOwnerUserId(caller.userId());

        try {
            variable = repository.saveAndFlush(variable);
        } catch (DataIntegrityViolationException e) {
            // another request took the name between the check above and the insert
            throw new GlobalVariableValidationException(List.of(nameTaken(name)));
        }

        changeRepository.save(GlobalVariableChange.savedByUser(variable, GlobalVariableChange.Type.CREATE,
                null, variable.getVersion(), null, value, caller.userId()));

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
        validateSecret(request.secret(), violations);
        String description = validateDescription(request.description(), violations);
        String value = serializeValue(request.value(), violations);
        ScopeSpec scope = validateScope(request.scope(), violations);
        throwIfAny(violations);

        ScopeSpec oldScope = new ScopeSpec(variable.getScopeType(), Set.copyOf(variable.getScopeTargets()));
        requireChangeKeepsUsages(variable, !name.equals(variable.getName()), scope.equals(oldScope) ? null : scope);

        long versionFrom = variable.getVersion();
        String oldValue = variable.getValue();
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
        boolean valueChanged = !Objects.equals(value, oldValue);
        if (valueChanged) {
            variable.setValue(value);
        }

        if (!valueChanged && before.isEmpty()) {
            return mapper.toDetail(variable, permissions);
        }

        variable = saveChanged(variable, versionFrom);
        long versionTo = variable.getVersion();
        if (valueChanged) {
            changeRepository.save(GlobalVariableChange.savedByUser(variable, GlobalVariableChange.Type.VALUE,
                    versionFrom, versionTo, oldValue, value, caller.userId()));
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

        UsageImpact impact = usageImpact(variable, true, null);
        if (!impact.inUse().isEmpty()) {
            throw inUse(variable, impact.inUse(), "it cannot be deleted");
        }

        changeRepository.save(GlobalVariableChange.savedByUser(variable, GlobalVariableChange.Type.DELETE,
                variable.getVersion(), null, variable.getValue(), null, caller.userId()));
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

        return new PaginatedDto<>(changes, mapper::toChange);
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
                .map(mapper::toValue)
                .toList();
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
            return new GlobalVariableImpactDTO(usageImpact(variable, true, null).all(), List.of());
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

        return new GlobalVariableImpactDTO(usageImpact(variable, renamed, newScope).all(), List.of());
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
        if (!GlobalVariableMapper.isRestorable(change)) {
            throw invalid("changeId", Code.NOT_RESTORABLE, "This change log entry holds no value to restore");
        }

        String oldValue = variable.getValue();
        String restored = change.getNewValue();
        if (Objects.equals(restored, oldValue)) {
            return mapper.toDetail(variable, permissions);
        }

        long versionFrom = variable.getVersion();
        variable.setValue(restored);
        GlobalVariable saved = saveChanged(variable, versionFrom);
        changeRepository.save(GlobalVariableChange.savedByUser(saved, GlobalVariableChange.Type.RESTORE,
                versionFrom, saved.getVersion(), oldValue, restored, caller.userId()));

        return mapper.toDetail(saved, permissions);
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
     * Refuses a rename or a new scope that would break what uses the variable. A reference holds
     * the name, so a used variable keeps its name; and a workflow, a connector or a notification
     * that uses the variable stays in its scope.
     *
     * @param renamed  whether the request changes the name
     * @param newScope the scope the request asks for, or {@code null} if it keeps the scope
     */
    private void requireChangeKeepsUsages(GlobalVariable variable, boolean renamed, ScopeSpec newScope) {
        UsageImpact impact = usageImpact(variable, renamed, newScope);

        if (!impact.inUse().isEmpty()) {
            throw inUse(variable, impact.inUse(), "it cannot be renamed");
        }

        if (!impact.outOfScope().isEmpty()) {
            throw new GlobalVariableConflictException(GlobalVariableConflictException.Code.SCOPE_NARROWING,
                    "The new scope of global variable '%s' leaves out workflows, connectors or notifications that use it"
                            .formatted(variable.getName()),
                    variable.getVersion(), impact.outOfScope());
        }
    }

    /**
     * What stands in the way of a change: the usages that need the name of the variable, and the
     * usages a new scope leaves out.
     */
    private record UsageImpact(List<Blocking> inUse, List<Blocking> outOfScope) {

        static final UsageImpact NONE = new UsageImpact(List.of(), List.of());

        List<Blocking> all() {
            List<Blocking> all = new ArrayList<>(inUse);
            all.addAll(outOfScope);
            return all;
        }
    }

    /**
     * Works out what a change would break, without changing anything.
     *
     * @param losesName whether the change takes the name away: a rename or a delete
     * @param newScope  the scope the change asks for, or {@code null} if it keeps the scope
     */
    private UsageImpact usageImpact(GlobalVariable variable, boolean losesName, ScopeSpec newScope) {
        if (!losesName && newScope == null) {
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

        return new UsageImpact(inUse, outOfScope);
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
     * Describes usages as what blocks a change.
     *
     * @param reason why each of them blocks, as the impact preview names it: IN_USE or OUT_OF_SCOPE
     */
    private List<Blocking> toBlocking(List<GlobalVariableUsage> usages, String reason) {
        return usages.stream()
                .map(mapper::toUsage)
                .map(usage -> new Blocking(
                        usage.sourceType().name(), usage.sourceId(), usage.sourceTitle(),
                        usage.elementType() == null ? null : usage.elementType().name(), usage.elementLabel(),
                        usage.color(), usage.index(), usage.field(), reason))
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
        } else if (kind != GlobalVariableKind.CONSTANT) {
            violations.add(new Violation("kind", Code.KIND_NOT_SUPPORTED,
                    "Kind " + kind + " is not available yet, only CONSTANT is"));
        }
    }

    private static void validateSecret(Boolean secret, List<Violation> violations) {
        if (Boolean.TRUE.equals(secret)) {
            violations.add(new Violation("secret", Code.SECRET_NOT_SUPPORTED,
                    "Secret values are not available yet"));
        }
    }

    private static String validateDescription(String description, List<Violation> violations) {
        if (description != null && description.length() > DESCRIPTION_MAX_LENGTH) {
            violations.add(new Violation("description", Code.DESCRIPTION_TOO_LONG,
                    "A description has at most " + DESCRIPTION_MAX_LENGTH + " characters"));
        }

        return description;
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
