import {ComponentPermissionProps} from "@application/interfaces/IApplication";

/**
 * permission constants for invoker
 */
export const InvokerPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'INVOKER', name: 'CREATE'},
    READ: {entity: 'INVOKER', name: 'READ'},
    UPDATE: {entity: 'INVOKER', name: 'UPDATE'},
    DELETE: {entity: 'INVOKER', name: 'DELETE'},
};