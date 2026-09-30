export type OidcGroupMapping = {
    group: string
    ocRole: string
}

export type OidcInfo = {
    enabled: boolean
    displayName: string
}

export type OidcConfig = {
    enabled: boolean
    displayName: string
    issuerUri: string | null
    clientId: string | null
    clientSecretConfigured: boolean
    scopes: string[]
    redirectUri: string | null
    frontendRedirectUri: string | null
    userInfoUri: string | null
    emailClaim: string
    groupClaim: string
    defaultRole: string | null
    jitProvisioning: boolean
    groupRoleMapping: OidcGroupMapping[]
}
