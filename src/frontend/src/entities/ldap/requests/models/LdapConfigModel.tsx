export default interface LdapConfigModel {
    url: string,
    baseDN: string,
    userDN: string,
    groupDN: string,
    username: string,
    password: string,
    userSearchFilter: string,
    groupSearchFilter: string,
}
