package com.becon.opencelium.backend.resource.globalvariable;

import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.execution.globalvariable.GlobalScript;

import java.util.List;

/**
 * One global variable as the reference picker offers it: enough to show the entry and to insert
 * {@code {{global.name}}}, or for a script, to import it into an enhancement and call it. For a
 * mutable variable it also tells whether the workflow being edited may write it, so the
 * globalWrites editor and {@code set()} offer only the variables that workflow owns.
 *
 * @param valuePreview  the value as JSON text, cut to its first 100 characters; {@code null} for
 *                      a secret and a script
 * @param language      the language of a script: {@code js}, {@code python3} or {@code ruby};
 *                      {@code null} for the other kinds
 * @param parameters    the parameters a script declares, in the order a call passes them;
 *                      {@code null} for the other kinds
 * @param ownerWorkflow the workflow whose runs may write a mutable variable; {@code null} for the
 *                      other kinds, and once that workflow is deleted until another one is chosen
 * @param writable      whether the saved workflow the picker is opened for is the owner workflow
 *                      of this mutable variable, so that a save lets it write the variable; always
 *                      {@code false} for the other kinds and when the picker is opened for a
 *                      workflow that is not saved yet, a connector, a notification or nothing
 */
public record GlobalVariablePickerItemDTO(
        String name,
        GlobalVariableKind kind,
        String description,
        boolean secret,
        String valuePreview,
        String language,
        List<GlobalScript.Parameter> parameters,
        GlobalVariableDTO.WorkflowRef ownerWorkflow,
        boolean writable) {

    /** Creates an entry with no script, no owner workflow and no write access, as a constant has. */
    public GlobalVariablePickerItemDTO(
            String name, GlobalVariableKind kind, String description, boolean secret, String valuePreview) {
        this(name, kind, description, secret, valuePreview, null, null, null, false);
    }
}
