import type { Connection, Enhancement } from "../../types/connection";

export function updateEnhancementInConnection(
    connection: Connection,
    updatedEnhancement: Enhancement,
    onRemoveFieldBinding?: () => void,
): Connection {
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

                if (shouldRemove) return null;

                return { ...binding, enhancement: { ...updatedEnhancement } };
            })
            .filter(Boolean) as typeof connection.fieldBindings,
    };
}
