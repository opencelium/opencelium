export default [
    {
        "userId": 1,
        "email": "admin@opencelium.io",
        "username": "admin",
        "userGroup": {
            "groupId": 1,
            "name": "Admin",
            "description": null,
            "icon": null,
            // Every component with full rights, so a fully mocked session can open every page.
            "components": ['CONNECTION', 'CONNECTOR', 'SCHEDULE', 'USER', 'USERGROUP', 'MYPROFILE', 'DASHBOARD', 'APP', 'INVOKER', 'GLOBAL_VARIABLE']
                .map((name, index) => ({ componentId: index + 1, name, permissions: ['READ', 'CREATE', 'UPDATE', 'DELETE'] })),
        },
        "userDetail": {
            "name": "Admin",
            "surname": "Admin",
            "phoneNumber": "12343435",
            "department": "IT Administrator",
            "organization": "Org",
        },
    },
    {
        "userId": 2,
        "email": "test@user.com",
        "username": null,
        "userGroup": {
            "groupId": 2,
            "name": "User",
        },
        "userDetail": {
            "name": "test",
            "surname": "test",
            "userTitle": "",
            "phoneNumber": "",
            "department": "",
            "organization": "",
        },
    },
    {
        "userId": 3,
        "email": null,
        "username": "test2",
        "userGroup": {
            "groupId": 2,
            "name": "User",
        },
        "userDetail": {
            "name": "name",
            "surname": "surname",
            "userTitle": "mr",
            "phoneNumber": "123",
            "department": "dep",
            "organization": "org",
        },
    }
]
