
/*
 * Copyright (C) <2020>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

//Authentication
const Authentication = {
    email: 'admin@gmail.com',
    password: '1234'
};
const AuthenticationResponseSuccess = {
    status: 200,
    success: 'true'
};
const AuthenticationResponseError = {
    timestamp: '2018-05-24T12:44:26.295+0000',
    status : 404,
    error : {message: 'SERVER_ERROR'},         //i use only this in case of error, the rest up to you
    success : 'false',
    path : '/api/user/all'
};

//User
//AddUser
const AddUserRequest = {
    email: 'user@gmail.com',
    password: '1234',
    userGroup: 2,                           //user group id
    userDetail: {
        name: 'User',
        surname: 'Userov',
        phoneNumber: '+99830 302 03 23',
        department: 'Managers',
        organisation: 'Locta',
        salutation: 'Salutations'
    }
};
const AddUserResponseSuccess = {
    status: 200,
    success: 'true',
    data: {
        id: 2,
        userGroup: {
            id: 2,
            name: 'ROLE_USER',
            description: 'User role',
            components: [{
                id: 2,
                name: 'CONNECTION',
                description: 'Read and create connection',
                permissions: ['READ', 'CREATE']
            }, {
                id: 3,
                name: 'TRANSACTION',
                description: 'Read and create transaction',
                permissions: ['READ', 'CREATE']
            }]
        }
    }
};
const AddUserResponseError = {
    timestamp: '2018-05-24T12:44:26.295+0000',
    status : 404,
    error : {message: 'ADD_USER_REJECTED'},         //i use only this in case of error, the rest up to you
    success : 'false',
    path : '/api/user/all'
};

//UpdateUser
const UpdateUserRequest = {
    id: 2,
    password: '1234'
};
const UpdateUserResponseSuccess = {
    status: 200,
    success: 'true'
};
const UpdateUserResponseError = {
    timestamp: '2018-05-24T12:44:26.295+0000',
    status : 404,
    error : {message: 'UPDATE_USER_REJECTED'},
    success : 'false',
    path : '/api/user/all'
};

//UpdateUserUserGroup
const UpdateUserUserGroupRequest = {
    id: 3
};
const UpdateUserUserGroupResponseSuccess = {
    status: 200,
    success: 'true'
};
const UpdateUserUserGroupResponseError = {
    timestamp: '2018-05-24T12:44:26.295+0000',
    status : 404,
    error : {message: 'UPDATE_USERUSERGROUP_REJECTED'},
    success : 'false',
    path : '/api/user/all'
};

//UpdateUserDetail
const UpdateUserDetailRequest = {
    id: 2,
    userGroup: 1,                           //user group id
    userDetail: {
        name: 'User2',
        surname: 'Userov',
        phoneNumber: '+99830 302 03 23',
        department: 'Managers',
        organisation: 'Locta',
        salutation: 'Salutations'
    }
};
const UpdateUserDetailResponseSuccess = {
    status: 200,
    success: 'true',
    data: {
        userGroup: {
            name: 'ROLE_ADMIN',
            description: 'Admin role',
            components: [{
                name: 'USER',
                description: 'Read and create user',
                permissions: ['READ', 'CREATE', 'UPDATE', 'DELETE']
            }]
        }
    }
};
const UpdateUserDetailResponseError = {
    timestamp: '2018-05-24T12:44:26.295+0000',
    status : 404,
    error : {message: 'UPDATE_USERDETAIL_REJECTED'},
    success : 'false',
    path : '/api/user/all'
};

//GetUser
const GetUserRequest = {};
const GetUserResponseSuccess = {
    id: 2,
    email: 'user@gmail.com',
    userGroup: {
        name: 'ROLE_USER',
        description: 'User role',
        components: [{
            name: 'CONNECTION',
            description: 'Read and create connection',
            permissions: ['READ','CREATE']
        },{
            name: 'TRANSACTION',
            description: 'Read and create transaction',
            permissions: ['READ','CREATE']
        }]
    },
    userDetail: {
        name: 'User',
        surname: 'Userov',
        phoneNumber: '+99830 302 03 23',
        department: 'Managers',
        organisation: 'Locta',
        salutation: 'Salutations'
    }
};
const GetUserResponseError = {
    timestamp: '2018-05-24T12:44:26.295+0000',
    status : 404,
    error : {message: 'GET_USER_REJECTED'},
    success : 'false',
    path : '/api/user/all'
};

const GetAllUsersRequest = {};
const GetAllUsersResponseSuccess = {
    _embedded: {
        userResources: [
            {
                id: 1,
                email: 'admin@gmail.com',
                userGroup: {
                    name: 'ROLE_ADMIN',
                    description: 'Admin role',
                    components: [{
                        name: 'USER',
                        description: 'User manager',
                        permissions: ['READ', 'CREATE', 'UPDATE', 'DELETE']
                    }]
                },
                userDetail: {
                    name: 'Admin',
                    surname: 'Adminov',
                    phoneNumber: '+99830 302 03 23',
                    department: 'Managers',
                    organisation: 'Locta',
                    salutation: 'Salutations'
                }
            },{
                id: 2,
                email: 'user@gmail.com',
                userGroup: {
                    name: 'ROLE_USER',
                    description: 'User role',
                    components: [{
                        name: 'CONNECTION',
                        description: 'Read and create connection',
                        permissions: ['READ', 'CREATE']
                    }, {
                        name: 'TRANSACTION',
                        description: 'Read and create transaction',
                        permissions: ['READ', 'CREATE']
                    }]
                },
                userDetail: {
                    name: 'User',
                    surname: 'Userov',
                    phoneNumber: '+99830 302 03 23',
                    department: 'Managers',
                    organisation: 'Locta',
                    salutation: 'Salutations'
                }
            }
        ]
    }
};
const GetAllUsersResponseError = {
    timestamp: '2018-05-24T12:44:26.295+0000',
    status : 404,
    error : {message: 'GET_USERS_REJECTED'},
    success : 'false',
    path : '/api/user/all'
};

//DeleteUser
const DeleteUserRequest = {};
const DeleteUserResponseSuccess = {
    status: 204,
    success: 'true'
};
const DeleteUserResponseError = {
    timestamp: '2018-05-24T12:44:26.295+0000',
    status : 404,
    error : {message: 'DELETE_USER_REJECTED'},
    success : 'false',
    path : '/api/user/all'
};


//UserGroup
//AddUserGroup
const AddUserGroupRequest = {
    name: 'ROLE_ADMIN',
    description: 'Administrator role',
    icon: '',
    components: [{
        id: 1,
        permissions: [1, 2, 3, 4]},{
        id: 2,
        permissions: [1, 2]}
    ]
};
const AddUserGroupResponseSuccess = {
    status: 200,
    success: 'true',
    data: {
        id: 3,
        components: [
            {
                id: 1,
                name: 'USER',
                description: 'Manage users',
                permissions: [1, 2, 3, 4]
            },
            {
                id: 2,
                name: 'CONNECTION',
                description: 'Read and create connection',
                permissions: [1, 2]
            }]
    }
};
const AddUserGroupResponseError = {
    timestamp: '2018-05-24T12:44:26.295+0000',
    status : 404,
    error : {message: 'ADD_USERGROUP_REJECTED'},
    success : 'false',
    path : '/api/user/all'
};

//UpdateUserGroup
const UpdateUserGroupRequest = {
    id: 1,
    name: 'ROLE_ADMIN',
    description: 'Administrator role',
    components: [{
        id: 1,
        permissions: [1, 2, 3, 4]},{
        id: 2,
        permissions: [1, 2]}
    ]
};
const UpdateUserGroupResponseSuccess = {
    status: 200,
    success: 'true',
    data: {
        id: 3,
        components: [
            {
                id: 1,
                name: 'USER',
                description: 'Manage users',
                operations: [1, 2, 3, 4]
            },
            {
                id: 2,
                name: 'CONNECTION',
                description: 'Read and create connection',
                operations: [1, 2]
            }]
    }
};
const UpdateUserGroupResponseError = {
    timestamp: '2018-05-24T12:44:26.295+0000',
    status : 404,
    error : {message: 'ADD_USERGROUP_REJECTED'},
    success : 'false',
    path : '/api/user/all'
};

//GetUserGroup
const GetUserGroupRequest = {};
const GetUserGroupResponseSuccess = {
    id: 1,
    name: 'ROLE_ADMIN',
    description: 'Administrator role',
    icon: '',
    components: [{
        id: 1,
        name: 'USER',
        description: 'Gets permission for user management',
        operations: [1, 2, 3, 4]
    }]
};
const GetUserGroupResponseError = {
    timestamp: '2018-05-24T12:44:26.295+0000',
    status : 404,
    error : {message: 'GET_USERGROUP_REJECTED'},
    success : 'false',
    path : '/api/user/all'
};

//GetAllUserGroups
const GetAllUserGroupsRequest = {};
const GetAllUserGroupsResponseSuccess = {
    _embedded: {
        userGroupResources: [
            {
                id: 1,
                name: 'ROLE_ADMIN',
                description: 'Administrator role',
                icon: '',
                components: [{
                    id: 1,
                    name: 'USER',
                    description: 'Gets permission for user management',
                    operations: [1, 2, 3, 4]
                }]
            }
        ]
    }
};
const GetAllUserGroupsResponseError = {
    timestamp: '2018-05-24T12:44:26.295+0000',
    status : 404,
    error : {message: 'GET_USERGROUPS_REJECTED'},
    success : 'false',
    path : '/api/user/all'
};

//DeleteUserGroup
const DeleteUserGroupRequest = {};
const DeleteUserGroupResponseSuccess = {
    status : 204,
    success : 'true',
};
const DeleteUserGroupResponseError = {
    timestamp: '2018-05-24T12:44:26.295+0000',
    status : 404,
    error : {message: 'DELETE_USERGROUP_REJECTED'},
    success : 'false',
    path : '/api/user/all'
};