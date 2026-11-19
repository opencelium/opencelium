package com.becon.opencelium.backend.resource.globalvariable;

import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;

/**
 * One global variable as the reference picker offers it: enough to show the entry and to insert
 * {@code {{global.name}}}.
 *
 * @param valuePreview the value as JSON text, cut to its first 100 characters; {@code null} for
 *                     a secret
 */
public record GlobalVariablePickerItemDTO(
        String name,
        GlobalVariableKind kind,
        String description,
        boolean secret,
        String valuePreview) {
}
