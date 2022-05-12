import {ComponentPermissionProps} from "@application/interfaces/IApplication";

/**
 * permission constants for notification template
 */
export const NotificationTemplatePermissions: ComponentPermissionProps = {
    CREATE: {entity: 'SCHEDULE', name: 'CREATE'},
    READ: {entity: 'SCHEDULE', name: 'READ'},
    UPDATE: {entity: 'SCHEDULE', name: 'UPDATE'},
    DELETE: {entity: 'SCHEDULE', name: 'DELETE'},
};