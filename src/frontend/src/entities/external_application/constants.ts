import {ComponentPermissionProps} from "@application/interfaces/IApplication";

/**
 * permission constants for app
 */
export const ExternalApplicationPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'APP', name: 'CREATE'},
    READ: {entity: 'APP', name: 'READ'},
    UPDATE: {entity: 'APP', name: 'UPDATE'},
    DELETE: {entity: 'APP', name: 'DELETE'},
};