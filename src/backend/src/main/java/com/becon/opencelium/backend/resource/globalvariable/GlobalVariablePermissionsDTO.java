package com.becon.opencelium.backend.resource.globalvariable;

import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;

import java.util.List;
import java.util.Set;

/**
 * Who may use, edit and delete one global variable.
 *
 * @param ownerUser the creator, who holds every permission; {@code null} once that user is deleted
 * @param grants    what the owner granted to other users
 * @param version   version of the variable; send it back when the grants are changed
 */
public record GlobalVariablePermissionsDTO(
        GlobalVariableDTO.UserRef ownerUser,
        List<Grant> grants,
        long version) {

    /** The permissions of one user. */
    public record Grant(GlobalVariableDTO.UserRef user, Set<GlobalVariablePermission> permissions) {
    }

    /**
     * Body of {@code PUT /global-variable/{id}/permissions}. The given grants replace all
     * existing ones.
     *
     * @param version the version the form loaded
     */
    public record Request(List<GrantRequest> grants, Long version) {
    }

    /** The permissions to grant to one user. */
    public record GrantRequest(Integer userId, Set<GlobalVariablePermission> permissions) {
    }
}
