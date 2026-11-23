package com.becon.opencelium.backend.resource.globalvariable;

import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.execution.globalvariable.GlobalScript;

import java.util.List;

/**
 * One global variable as the reference picker offers it: enough to show the entry and to insert
 * {@code {{global.name}}}, or for a script, to import it into an enhancement and call it.
 *
 * @param valuePreview the value as JSON text, cut to its first 100 characters; {@code null} for
 *                     a secret and a script
 * @param language     the language of a script, e.g. {@code js}; {@code null} for the other kinds
 * @param parameters   the parameters a script declares, in the order a call passes them;
 *                     {@code null} for the other kinds
 */
public record GlobalVariablePickerItemDTO(
        String name,
        GlobalVariableKind kind,
        String description,
        boolean secret,
        String valuePreview,
        String language,
        List<GlobalScript.Parameter> parameters) {

    /** Creates the entry of a constant or a mutable variable, which has no script. */
    public GlobalVariablePickerItemDTO(
            String name, GlobalVariableKind kind, String description, boolean secret, String valuePreview) {
        this(name, kind, description, secret, valuePreview, null, null);
    }
}
