import {ComponentPermissionProps} from "@application/interfaces/IApplication";

/**
 * permission constants for usergroup
 */
export const UserGroupPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'USERGROUP', name: 'CREATE'},
    READ: {entity: 'USERGROUP', name: 'READ'},
    UPDATE: {entity: 'USERGROUP', name: 'UPDATE'},
    DELETE: {entity: 'USERGROUP', name: 'DELETE'},
};