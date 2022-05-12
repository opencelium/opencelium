import {ComponentPermissionProps} from "@application/interfaces/IApplication";

/**
 * permission constants for my profile
 */
export const MyProfilePermissions: ComponentPermissionProps = {
    CREATE: {entity: 'MYPROFILE', name: 'CREATE'},
    READ: {entity: 'MYPROFILE', name: 'READ'},
    UPDATE: {entity: 'MYPROFILE', name: 'UPDATE'},
    DELETE: {entity: 'MYPROFILE', name: 'DELETE'},
};