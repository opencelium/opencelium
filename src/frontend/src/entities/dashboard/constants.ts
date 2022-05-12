import {ComponentPermissionProps} from "@application/interfaces/IApplication";

/**
 * (not used) permission constants for dashboard
 */
export const DashboardPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'DASHBOARD', name: 'CREATE'},
    READ: {entity: 'DASHBOARD', name: 'READ'},
    UPDATE: {entity: 'DASHBOARD', name: 'UPDATE'},
    DELETE: {entity: 'DASHBOARD', name: 'DELETE'},
};