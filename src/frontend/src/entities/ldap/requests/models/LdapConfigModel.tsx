export default interface LdapConfigModel {
    url: string,
    baseDN: string,
    userDN: string,
    groupDN: string,
    readAccountDN: string,
    readAccountPassword: string,
    userSearchFilter: string,
    groupSearchFilter: string,
}
