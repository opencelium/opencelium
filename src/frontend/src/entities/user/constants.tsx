/**
 * permission constants for user
 */
import {ComponentPermissionProps} from "@application/interfaces/IApplication";

export const UserPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'USER', name: 'CREATE'},
    READ: {entity: 'USER', name: 'READ'},
    UPDATE: {entity: 'USER', name: 'UPDATE'},
    DELETE: {entity: 'USER', name: 'DELETE'},
};