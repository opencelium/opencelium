import {ComponentPermissionProps} from "@application/interfaces/IApplication";

/**
 * permission constants for connector
 */
export const ConnectorPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'CONNECTOR', name: 'CREATE'},
    READ: {entity: 'CONNECTOR', name: 'READ'},
    UPDATE: {entity: 'CONNECTOR', name: 'UPDATE'},
    DELETE: {entity: 'CONNECTOR', name: 'DELETE'},
};