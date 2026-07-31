export type LdapConfig = {
    urls: string,
    userDN: string,
    groupDN: string,
    username: string,
    password: string,
    userSearchFilter: string,
    groupSearchFilter: string,
}


export type LdapLog = {
    title: string,
    text: string,
}
