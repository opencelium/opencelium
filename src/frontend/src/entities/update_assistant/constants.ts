import {ComponentPermissionProps} from "@application/interfaces/IApplication";

/**
 * permission constants for update assistant
 */
export const UpdateAssistantPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'CONNECION', name: 'CREATE'},
    READ: {entity: 'CONNECION', name: 'READ'},
    UPDATE: {entity: 'CONNECION', name: 'UPDATE'},
    DELETE: {entity: 'CONNECION', name: 'DELETE'},
}