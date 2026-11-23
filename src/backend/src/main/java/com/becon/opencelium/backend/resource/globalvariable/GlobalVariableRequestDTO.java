package com.becon.opencelium.backend.resource.globalvariable;

import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableBusyPolicy;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * Body of {@code POST /global-variable} and {@code PUT /global-variable/{id}}.
 *
 * @param name        unique name: letters, digits and {@code _}, starting with a letter, at most
 *                    64 characters
 * @param kind        kind of the variable; it cannot change after creation
 * @param description free text, at most 512 characters
 * @param value       the value as real JSON of any type; left out or {@code null} is JSON null,
 *                    except on an update of a secret, where it keeps the hidden value. For a
 *                    mutable variable it is the initial value: saving it leaves the current
 *                    value alone until a reset
 * @param secret      whether the value is hidden after saving; left out on an update keeps the
 *                    flag, and clearing it needs a new value
 * @param scope       which workflows may use the variable
 * @param busyPolicy  mutable variables only: what a second start of a workflow using it does;
 *                    left out is QUEUE on create and keeps the policy on update
 * @param ownerWorkflowId mutable variables only: the workflow whose runs may write it, which
 *                    must be in the scope; required on create, left out on update keeps it
 * @param version     the version the edit form loaded; required on update, ignored on create
 * @param script      script variables only, required on create and update: the language, which
 *                    cannot change, the code and the parameters. A script variable leaves
 *                    {@code value} out
 */
public record GlobalVariableRequestDTO(
        String name,
        GlobalVariableKind kind,
        String description,
        @Schema(description = "Any JSON value: string, number, boolean, null, array or map") JsonNode value,
        Boolean secret,
        Scope scope,
        GlobalVariableBusyPolicy busyPolicy,
        Long ownerWorkflowId,
        Long version,
        Script script) {

    // Jackson 2.14 takes this one, not the shorter constructor below, for a request body
    @JsonCreator
    public GlobalVariableRequestDTO {
    }

    /** Creates the request of a constant or a mutable variable, which has no script. */
    public GlobalVariableRequestDTO(String name, GlobalVariableKind kind, String description, JsonNode value,
            Boolean secret, Scope scope, GlobalVariableBusyPolicy busyPolicy, Long ownerWorkflowId, Long version) {
        this(name, kind, description, value, secret, scope, busyPolicy, ownerWorkflowId, version, null);
    }

    // a request body is logged through this, e.g. by Spring MVC at DEBUG: a value that may be a
    // secret, which an update that leaves the flag out may be, stays out
    @Override
    public String toString() {
        Object shownValue = Boolean.FALSE.equals(secret) ? value : "****";

        return ("GlobalVariableRequestDTO[name=%s, kind=%s, description=%s, value=%s, secret=%s, scope=%s, "
                + "busyPolicy=%s, ownerWorkflowId=%s, version=%s, script=%s]")
                .formatted(name, kind, description, shownValue, secret, scope, busyPolicy, ownerWorkflowId, version,
                        script);
    }

    /**
     * The script of a script variable.
     *
     * @param language   {@code js}; Python and Ruby come later
     * @param code       the body of the function; it returns the result with {@code return}
     * @param parameters the declared parameters, in the order a call passes them
     */
    public record Script(String language, String code, List<Parameter> parameters) {
    }

    /**
     * One declared parameter.
     *
     * @param required     whether a call must pass it; left out, a parameter is required unless
     *                     it has a default
     * @param defaultValue what a call that leaves it out gets, any JSON; only for a parameter
     *                     that is not required
     */
    public record Parameter(
            String name,
            String description,
            Boolean required,
            @JsonProperty("default") JsonNode defaultValue) {
    }

    /**
     * Scope of the variable. Only the list that belongs to {@code type} is read: {@code
     * categoryIds} for CATEGORIES, {@code workflowIds} for WORKFLOWS, none for ALL.
     */
    public record Scope(GlobalVariableScopeType type, List<Long> categoryIds, List<Long> workflowIds) {
    }
}
