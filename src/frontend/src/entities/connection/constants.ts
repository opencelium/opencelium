import {ComponentPermissionProps} from "@application/interfaces/IApplication";

/**
 * permission constants for connection
 */
export const ConnectionPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'CONNECTION', name: 'CREATE'},
    READ: {entity: 'CONNECTION', name: 'READ'},
    UPDATE: {entity: 'CONNECTION', name: 'UPDATE'},
    DELETE: {entity: 'CONNECTION', name: 'DELETE'},
};