export default interface LdapConfigModel {
    urls: string,
    userDN: string,
    groupDN: string,
    username: string,
    password: string,
    userSearchFilter: string,
    groupSearchFilter: string,
}
