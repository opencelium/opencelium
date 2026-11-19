package com.becon.opencelium.backend.resource.globalvariable;

/**
 * Body of {@code POST /global-variable/{id}/restore/{changeId}}.
 *
 * @param version the version of the variable the page loaded
 */
public record GlobalVariableRestoreRequestDTO(Long version) {
}
