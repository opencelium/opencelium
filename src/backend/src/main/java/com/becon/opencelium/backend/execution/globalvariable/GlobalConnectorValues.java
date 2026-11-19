package com.becon.opencelium.backend.execution.globalvariable;

import com.becon.opencelium.backend.database.mysql.entity.RequestData;

import java.util.List;
import java.util.function.Supplier;

/**
 * Puts the values of global variables into the request data of a connector.
 *
 * <p>This has to happen before anything else reads the request data. A value such as {@code
 * {{global.idoitUrl}}/api} would otherwise be taken for a reference to another field, and a
 * field that is computed by a request, for example a token, would be asked for at an address
 * that still holds the reference.
 *
 * <p>A connector is shared by the workflows of every category, so only variables that are open
 * to all workflows are read. A value that is put in is not searched for further references.
 */
public final class GlobalConnectorValues {

    private GlobalConnectorValues() {
    }

    /**
     * Replaces the global variable references in the values of {@code requestData}, in place. The
     * entries must not be managed by a persistence context: the resolved values are for use, not
     * for storing.
     *
     * @param requestData the request data of a connector, with its values as they were written
     * @param globals     gives the variables to read; asked once, and only if a value holds a
     *                    reference
     * @throws com.becon.opencelium.backend.exception.GlobalVariableNotFoundException if a
     *         variable does not exist or is not open to all workflows
     */
    public static void resolve(List<RequestData> requestData, Supplier<GlobalVariableSnapshot> globals) {
        if (requestData == null) {
            return;
        }

        GlobalVariableSnapshot snapshot = null;
        for (RequestData entry : requestData) {
            if (entry == null || !GlobalTextRenderer.hasTokens(entry.getValue())) {
                continue;
            }

            if (snapshot == null) {
                snapshot = globals.get();
            }

            entry.setValue(resolve(entry.getValue(), snapshot));
        }
    }

    private static String resolve(String value, GlobalVariableSnapshot snapshot) {
        return GlobalTextRenderer.render(value, reference ->
                GlobalValueCaster.toText(GlobalValueResolver.resolveForConnector(snapshot, reference)));
    }
}
