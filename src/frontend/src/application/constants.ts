/**
 * permission constants for update assistant
 */
/*
* TODO: change entity when backend will be ready
*/
import {ComponentPermissionProps} from "./interfaces/IApplication";

/*
* TODO: change entity when backend will be ready
*/
export const UpdateSubscriptionPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'USERGROUP', name: 'CREATE'},
    READ: {entity: 'USERGROUP', name: 'READ'},
    UPDATE: {entity: 'USERGROUP', name: 'UPDATE'},
    DELETE: {entity: 'USERGROUP', name: 'DELETE'},
};