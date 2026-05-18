import type { Connection, Enhancement } from "../../types/connection";

export function updateEnhancementInConnection(
    connection: Connection,
    updatedEnhancement: Enhancement,
    onRemoveFieldBinding?: () => void,
): Connection {
    // Determine if only RESULT_VAR remains
    const argKeys = Object.keys(updatedEnhancement.args || {}).filter(
        (key) => key !== "RESULT_VAR"
    );
    const shouldRemove = argKeys.length === 0;
    if (shouldRemove && onRemoveFieldBinding) {
        onRemoveFieldBinding();
    }
    return {
        ...connection,
        fieldBindings: connection.fieldBindings
            .map((binding) => {
                if (binding.enhancement.enhanceId !== updatedEnhancement.enhanceId)
                    return binding;

                // Remove this binding completely if it has no more args
                if (shouldRemove) return null;

                return { ...binding, enhancement: { ...updatedEnhancement } };
            })
            .filter(Boolean) as typeof connection.fieldBindings, // filter out null
    };
}
