package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableChange;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableService;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.resource.application.ResultDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.error.GlobalVariableErrorResource;
import com.becon.opencelium.backend.resource.globalvariable.GlobalScriptTestDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableChangeDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableImpactDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableListItemDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariablePermissionsDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariablePickerItemDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableRequestDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableRestoreRequestDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableUsageDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableValueDTO;
import com.becon.opencelium.backend.resource.subs.PaginatedDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Global variables: named values that users define once and that workflows, connectors and
 * notifications read through {@code {{global.name}}}.
 *
 * <p>Access has two layers. The {@code GLOBAL_VARIABLE} component permission of the user's role
 * opens each endpoint ({@link com.becon.opencelium.backend.security.GlobalVariableSecurity});
 * the permissions on the single variable (VIEW_USE, EDIT, DELETE) are enforced by the service.
 */
@RestController
@Tag(name = "Global Variable", description = "Named values shared by workflows, connectors and notifications")
@RequestMapping(value = "/global-variable", produces = MediaType.APPLICATION_JSON_VALUE)
public class GlobalVariableController {

    private final GlobalVariableService globalVariableService;

    public GlobalVariableController(GlobalVariableService globalVariableService) {
        this.globalVariableService = globalVariableService;
    }

    @Operation(summary = "Lists the global variables the caller may view, paged")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "A page of global variables."),
            @ApiResponse(responseCode = "403",
                    description = "The caller's role has no READ permission on GLOBAL_VARIABLE.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("@globalVariableSecurity.can('READ')")
    @GetMapping("/all")
    public ResponseEntity<PaginatedDto<GlobalVariable, GlobalVariableListItemDTO>> getAll(
            @Parameter(description = "Page index from 0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size, at most 100") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort as property,direction: name, kind, createdAt or updatedAt")
            @RequestParam(defaultValue = "name,asc") String sort,
            @Parameter(description = "Text to find in the name or the description")
            @RequestParam(required = false) String search,
            @Parameter(description = "Kind to keep") @RequestParam(required = false) GlobalVariableKind kind) {
        return ResponseEntity.ok(globalVariableService.findAll(search, kind, page, size, sort));
    }

    @Operation(summary = "Retrieves one global variable")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "The global variable.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableDTO.class))),
            @ApiResponse(responseCode = "403", description = "The caller has no VIEW_USE permission on it.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "404", description = "The variable does not exist.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("@globalVariableSecurity.can('READ')")
    @GetMapping("/{id}")
    public ResponseEntity<GlobalVariableDTO> get(@PathVariable("id") long id) {
        return ResponseEntity.ok(globalVariableService.getById(id));
    }

    @Operation(summary = "Checks whether a name is still free, whatever its case")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "result is true when no variable has the name.",
                    content = @Content(schema = @Schema(implementation = ResultDTO.class))),
    })
    @PreAuthorize("@globalVariableSecurity.can('READ')")
    @GetMapping("/unique/{name}")
    public ResponseEntity<ResultDTO<Boolean>> isNameUnique(@PathVariable("name") String name) {
        return ResponseEntity.ok(new ResultDTO<>(globalVariableService.isNameAvailable(name)));
    }

    @Operation(summary = "Creates a global variable owned by the caller")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "The created global variable.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableDTO.class))),
            @ApiResponse(responseCode = "400", description = "The request is invalid; violations name each field.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableErrorResource.class))),
            @ApiResponse(responseCode = "403",
                    description = "The caller's role has no CREATE permission on GLOBAL_VARIABLE.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("@globalVariableSecurity.can('CREATE')")
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GlobalVariableDTO> create(@RequestBody GlobalVariableRequestDTO request) {
        return ResponseEntity.ok(globalVariableService.create(request));
    }

    @Operation(summary = "Changes a global variable; the body carries the version the form loaded")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "The changed global variable.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableDTO.class))),
            @ApiResponse(responseCode = "400", description = "The request is invalid; violations name each field.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableErrorResource.class))),
            @ApiResponse(responseCode = "403", description = "The caller has no EDIT permission on it.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "404", description = "The variable does not exist.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "409",
                    description = "The variable changed after the form loaded it, or it is used and the change"
                            + " would rename it, leave a workflow out of its scope or change script parameters"
                            + " in a way the calls no longer fit.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableErrorResource.class))),
    })
    @PreAuthorize("@globalVariableSecurity.can('UPDATE')")
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GlobalVariableDTO> update(
            @PathVariable("id") long id, @RequestBody GlobalVariableRequestDTO request) {
        return ResponseEntity.ok(globalVariableService.update(id, request));
    }

    @Operation(summary = "Deletes a global variable")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "The variable has been deleted."),
            @ApiResponse(responseCode = "409", description = "The variable is still used; blocking lists where.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableErrorResource.class))),
            @ApiResponse(responseCode = "403", description = "The caller has no DELETE permission on it.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "404", description = "The variable does not exist.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("@globalVariableSecurity.can('DELETE')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") long id) {
        globalVariableService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Lists the variables the caller may use in one place, for the reference picker")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "The usable variables ordered by name, unpaged. A"
                    + " mutable variable names its owner workflow and is writable when that is the connectionId."),
            @ApiResponse(responseCode = "400", description = "More than one of the parameters is given.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableErrorResource.class))),
            @ApiResponse(responseCode = "404", description = "The workflow or the schedule does not exist.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("@globalVariableSecurity.can('READ')")
    @GetMapping("/picker")
    public ResponseEntity<List<GlobalVariablePickerItemDTO>> pick(
            @Parameter(description = "A saved workflow: the variables in its scope")
            @RequestParam(required = false) Long connectionId,
            @Parameter(description = "A workflow that is not saved yet: the variables its category reaches")
            @RequestParam(required = false) Integer categoryId,
            @Parameter(description = "A connector: only variables open to all workflows")
            @RequestParam(required = false) Integer connectorId,
            @Parameter(description = "A notification: the variables of the workflow of its schedule")
            @RequestParam(required = false) Integer schedulerId) {
        return ResponseEntity.ok(globalVariableService.pick(connectionId, categoryId, connectorId, schedulerId));
    }

    @Operation(summary = "Returns the current value and version of up to 100 variables, or of every constant and "
            + "mutable variable in scope of a workflow, for polling")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "The values, with an ETag built from the ids, versions, revisions and "
                            + "running owner workflows."),
            @ApiResponse(responseCode = "304", description = "Nothing changed since the ETag sent in If-None-Match."),
            @ApiResponse(responseCode = "400",
                    description = "Neither or both of ids and workflowId, more than 100 ids, or a script variable.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableErrorResource.class))),
            @ApiResponse(responseCode = "404", description = "The workflow does not exist.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("@globalVariableSecurity.can('READ')")
    @GetMapping("/values")
    public ResponseEntity<List<GlobalVariableValueDTO>> getValues(
            @Parameter(description = "Ids of the variables, comma separated")
            @RequestParam(required = false) List<Long> ids,
            @Parameter(description = "A saved workflow: the constants and mutable variables in its scope")
            @RequestParam(required = false) Long workflowId) {
        List<GlobalVariableValueDTO> values = globalVariableService.getValues(ids, workflowId);

        // with a matching If-None-Match Spring answers 304 without a body; no-cache makes the
        // browser ask every time instead of showing a value it kept
        return ResponseEntity.ok()
                .eTag(GlobalVariableValueDTO.etagOf(values))
                .cacheControl(CacheControl.noCache())
                .body(values);
    }

    @Operation(summary = "Tells what a change or a delete would block, before it is saved")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "The usages that would block the change.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableImpactDTO.class))),
            @ApiResponse(responseCode = "403", description = "The caller may neither edit nor delete it.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "404", description = "The variable does not exist.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("@globalVariableSecurity.can('UPDATE') or @globalVariableSecurity.can('DELETE')")
    @PostMapping(value = "/{id}/impact", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GlobalVariableImpactDTO> impact(
            @PathVariable("id") long id, @RequestBody GlobalVariableImpactDTO.Request request) {
        return ResponseEntity.ok(globalVariableService.impact(id, request));
    }

    @Operation(summary = "Sets a variable back to the value a change log entry saved")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "The variable with the restored value.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableDTO.class))),
            @ApiResponse(responseCode = "400",
                    description = "The version is missing, the entry holds no value, or the variable is a secret.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableErrorResource.class))),
            @ApiResponse(responseCode = "403", description = "The caller has no EDIT permission on it.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "404", description = "The variable or the entry does not exist.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "409", description = "The variable changed after the page loaded it, or"
                    + " it is a used script whose earlier parameters the calls made to it no longer fit.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableErrorResource.class))),
    })
    @PreAuthorize("@globalVariableSecurity.can('UPDATE')")
    @PostMapping(value = "/{id}/restore/{changeId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GlobalVariableDTO> restore(
            @PathVariable("id") long id, @PathVariable("changeId") long changeId,
            @RequestBody GlobalVariableRestoreRequestDTO request) {
        return ResponseEntity.ok(globalVariableService.restore(id, changeId, request));
    }

    @Operation(summary = "Sets the current value of a mutable global variable back to its initial value")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "The variable with its reset current value.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableDTO.class))),
            @ApiResponse(responseCode = "400", description = "The variable is not mutable.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableErrorResource.class))),
            @ApiResponse(responseCode = "403", description = "The caller has no EDIT permission on it.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "404", description = "The variable does not exist.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("@globalVariableSecurity.can('UPDATE')")
    @PostMapping("/{id}/reset")
    public ResponseEntity<GlobalVariableDTO> reset(@PathVariable("id") long id) {
        return ResponseEntity.ok(globalVariableService.reset(id));
    }

    @Operation(summary = "Checks a script as saving does and calls it once with test arguments, without saving")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "The result of the call, or why the script is not valid.",
                    content = @Content(schema = @Schema(implementation = GlobalScriptTestDTO.class))),
            @ApiResponse(responseCode = "403", description = "The caller may neither create nor edit variables.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("@globalVariableSecurity.can('CREATE') or @globalVariableSecurity.can('UPDATE')")
    @PostMapping(value = "/validate-script", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GlobalScriptTestDTO> validateScript(@RequestBody GlobalScriptTestDTO.Request request) {
        return ResponseEntity.ok(globalVariableService.testScript(request));
    }

    @Operation(summary = "Lists where a global variable is used")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "The usages; empty when nothing uses the variable."),
            @ApiResponse(responseCode = "403", description = "The caller has no VIEW_USE permission on it.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "404", description = "The variable does not exist.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("@globalVariableSecurity.can('READ')")
    @GetMapping("/{id}/usage")
    public ResponseEntity<List<GlobalVariableUsageDTO>> getUsages(@PathVariable("id") long id) {
        return ResponseEntity.ok(globalVariableService.getUsages(id));
    }

    @Operation(summary = "Retrieves who may use, edit and delete a global variable")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "The owner user and the grants.",
                    content = @Content(schema = @Schema(implementation = GlobalVariablePermissionsDTO.class))),
            @ApiResponse(responseCode = "403", description = "The caller is neither the owner user nor an admin.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "404", description = "The variable does not exist.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("@globalVariableSecurity.can('READ')")
    @GetMapping("/{id}/permissions")
    public ResponseEntity<GlobalVariablePermissionsDTO> getPermissions(@PathVariable("id") long id) {
        return ResponseEntity.ok(globalVariableService.getPermissions(id));
    }

    @Operation(summary = "Replaces the grants of a global variable")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "The owner user and the new grants.",
                    content = @Content(schema = @Schema(implementation = GlobalVariablePermissionsDTO.class))),
            @ApiResponse(responseCode = "400", description = "The request is invalid; violations name each field.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableErrorResource.class))),
            @ApiResponse(responseCode = "403", description = "The caller is neither the owner user nor an admin.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "404", description = "The variable does not exist.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "409", description = "The variable changed after the form loaded it.",
                    content = @Content(schema = @Schema(implementation = GlobalVariableErrorResource.class))),
    })
    @PreAuthorize("@globalVariableSecurity.can('UPDATE')")
    @PutMapping(value = "/{id}/permissions", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GlobalVariablePermissionsDTO> updatePermissions(
            @PathVariable("id") long id, @RequestBody GlobalVariablePermissionsDTO.Request request) {
        return ResponseEntity.ok(globalVariableService.updatePermissions(id, request));
    }

    @Operation(summary = "Lists the change log of a global variable, newest entry first")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "A page of change log entries."),
            @ApiResponse(responseCode = "403", description = "The caller has no VIEW_USE permission on it.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "404", description = "The variable does not exist.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("@globalVariableSecurity.can('READ')")
    @GetMapping("/{id}/changes")
    public ResponseEntity<PaginatedDto<GlobalVariableChange, GlobalVariableChangeDTO>> getChanges(
            @PathVariable("id") long id,
            @Parameter(description = "Page index from 0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size, at most 100") @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(globalVariableService.getChanges(id, page, size));
    }
}
