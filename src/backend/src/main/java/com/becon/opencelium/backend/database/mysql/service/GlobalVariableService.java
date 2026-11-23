package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableChange;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
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

import java.util.List;

/**
 * Manages global variables for the authenticated user.
 *
 * <p>Every method acts on behalf of that user and enforces the permissions on the single
 * variable: the owner user and admins may do everything, other users what the owner granted.
 * A missing permission is a 403, an unknown id a 404. Every saved change writes its change log
 * entry in the same transaction.
 */
public interface GlobalVariableService {

    /**
     * Lists the variables the user may view.
     *
     * @param search text to find in the name or the description, may be {@code null}
     * @param kind   kind to keep, or {@code null} for every kind
     * @param page   page index from 0
     * @param size   page size
     * @param sort   {@code property,direction}, e.g. {@code name,asc}; may be {@code null}
     */
    PaginatedDto<GlobalVariable, GlobalVariableListItemDTO> findAll(
            String search, GlobalVariableKind kind, int page, int size, String sort);

    /** Returns one variable. Needs VIEW_USE on it. */
    GlobalVariableDTO getById(long id);

    /** Tells whether no variable has this name yet, whatever its case. */
    boolean isNameAvailable(String name);

    /**
     * Creates a variable owned by the user. The value of a secret is stored encrypted; the size
     * limit applies to its plain JSON text.
     *
     * @throws com.becon.opencelium.backend.exception.GlobalVariableValidationException if the
     *         request is invalid
     */
    GlobalVariableDTO create(GlobalVariableRequestDTO request);

    /**
     * Changes a variable. Needs EDIT on it. A request that changes nothing saves nothing.
     *
     * <p>A secret keeps its value when the request leaves {@code value} out or sends JSON null,
     * and a given value always replaces it, even an equal one, since the hidden value is never
     * compared. A request without {@code secret} keeps the flag. Setting the flag hides the
     * current or the given value and masks the values the change log holds; clearing it needs a
     * new value in the same request.
     *
     * @throws com.becon.opencelium.backend.exception.GlobalVariableValidationException if the
     *         request is invalid
     * @throws com.becon.opencelium.backend.exception.GlobalVariableConflictException if the
     *         variable changed after the version of the request was loaded, if it is renamed
     *         while it is used, or if its new scope leaves out a workflow, a connector or a
     *         notification that uses it
     */
    GlobalVariableDTO update(long id, GlobalVariableRequestDTO request);

    /**
     * Deletes a variable. Needs DELETE on it.
     *
     * @throws com.becon.opencelium.backend.exception.GlobalVariableConflictException if the
     *         variable is still used
     */
    void delete(long id);

    /** Returns where a variable is used. Needs VIEW_USE on it. */
    List<GlobalVariableUsageDTO> getUsages(long id);

    /**
     * Lists the variables the user may use in one place, for the reference picker. At most one
     * of the parameters is given; with none, only variables open to all workflows are listed.
     *
     * @param connectionId a saved workflow: the variables in its scope
     * @param categoryId   a workflow that is not saved yet: the variables its category reaches
     * @param connectorId  a connector: only variables open to all workflows
     * @param schedulerId  a notification: the variables in the scope of the workflow of its schedule
     * @return the variables ordered by name
     * @throws com.becon.opencelium.backend.exception.GlobalVariableValidationException if more
     *         than one parameter is given
     */
    List<GlobalVariablePickerItemDTO> pick(Long connectionId, Integer categoryId, Integer connectorId, Integer schedulerId);

    /**
     * Returns the variables the user may use in one workflow: the ones {@link #pick} lists for the
     * same parameters, with their scope targets loaded. A user whose role lacks the READ
     * permission on global variables, which opens the picker, gets none. At most one of the
     * parameters is given; with none, only variables open to all workflows are returned.
     *
     * @param connectionId a saved workflow: the variables in its scope
     * @param categoryId   a workflow that is not saved yet: the variables its category reaches
     * @return the variables of every kind, in no particular order
     * @throws com.becon.opencelium.backend.exception.GlobalVariableValidationException if both
     *         parameters are given
     * @throws com.becon.opencelium.backend.exception.GeneralServiceException with status 404 if
     *         the workflow does not exist, with status 401 if no user is authenticated
     */
    List<GlobalVariable> findUsable(Long connectionId, Integer categoryId);

    /**
     * Returns the last saved value and the version of the given variables, for polling. Unknown
     * ids and variables the user may not view are left out.
     *
     * @param ids one to a hundred ids
     * @return the values ordered by id
     * @throws com.becon.opencelium.backend.exception.GlobalVariableValidationException if no id
     *         or too many are given, or one of them is a script variable
     */
    List<GlobalVariableValueDTO> getValues(List<Long> ids);

    /**
     * Tells what a change would do to the usages of a variable, without making it. Needs DELETE
     * on the variable for a delete, EDIT otherwise.
     */
    GlobalVariableImpactDTO impact(long id, GlobalVariableImpactDTO.Request request);

    /**
     * Sets a variable back to the value a change log entry saved, as a new change of type
     * RESTORE. Needs EDIT on it. Restoring the value the variable already has saves nothing.
     *
     * @throws com.becon.opencelium.backend.exception.GlobalVariableValidationException if the
     *         version is missing, the entry holds no value to restore or the variable is a secret
     * @throws com.becon.opencelium.backend.exception.GlobalVariableConflictException if the
     *         variable changed after the version of the request was loaded
     */
    GlobalVariableDTO restore(long id, long changeId, GlobalVariableRestoreRequestDTO request);

    /**
     * Sets the current value of a mutable variable back to its initial value, as a change of
     * type RESET. Needs EDIT on it. The version stays as it is, so an open edit form stays
     * valid; the revision goes up.
     *
     * @throws com.becon.opencelium.backend.exception.GlobalVariableValidationException if the
     *         variable is not mutable
     */
    GlobalVariableDTO reset(long id);

    /**
     * Checks a script as saving a script variable checks it and, if it passes, calls it once with
     * the test arguments, under the time limit of a run. Nothing is saved. A script that is not
     * valid is an answer, not an error.
     */
    GlobalScriptTestDTO testScript(GlobalScriptTestDTO.Request request);

    /** Returns the grants of a variable. Only its owner user and admins may read them. */
    GlobalVariablePermissionsDTO getPermissions(long id);

    /**
     * Replaces the grants of a variable. Only its owner user and admins may do so.
     *
     * @throws com.becon.opencelium.backend.exception.GlobalVariableValidationException if the
     *         request is invalid
     * @throws com.becon.opencelium.backend.exception.GlobalVariableConflictException if the
     *         variable changed after the version of the request was loaded
     */
    GlobalVariablePermissionsDTO updatePermissions(long id, GlobalVariablePermissionsDTO.Request request);

    /** Returns the change log of a variable, newest entry first. Needs VIEW_USE on it. */
    PaginatedDto<GlobalVariableChange, GlobalVariableChangeDTO> getChanges(long id, int page, int size);
}
