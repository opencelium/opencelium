import {ComponentPermissionProps} from "@application/interfaces/IApplication";

/**
 * permission constants for admin cards
 */
export const AdminCardPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'USER', name: 'CREATE'},
    READ: {entity: 'USER', name: 'READ'},
    UPDATE: {entity: 'USER', name: 'UPDATE'},
    DELETE: {entity: 'USER', name: 'DELETE'},
};