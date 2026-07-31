export const mockSessions = {
    admin: {
        id: 'u-001',
        roles: ['admin'],
        permissions: ['all'],
        name: 'System Admin'
    },
    reporter: {
        id: 'u-002',
        roles: ['reporter'],
        permissions: ['read:reports', 'export:data'],
        name: 'Data Reporter'
    }
}
