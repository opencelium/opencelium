import ModelUser from "@entity/user/requests/models/User";
export const Roles = {
    USER: 'ROLE_USER',
    ADMIN: 'ROLE_ADMIN'
};
export default class Role {
    static isAdmin(user: ModelUser): boolean {
        return user.userGroup.name === Roles.ADMIN;
    }
}
