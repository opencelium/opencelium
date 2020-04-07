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

const host = 'localhost';
const port = '8888';

const jsonServer = require('json-server');
const mockServer = jsonServer.create();
const data = jsonServer.router('test/json-server/data.json');
const middleware = (req, res, next) => {
    res.header('Access-Control-Allow-Methods', 'POST,PUT,DELETE,GET,OPTIONS');
    res.header('Access-Control-Expose-Headers', 'Authorization');
    res.header('Access-Control-Allow-Headers', 'content-type, authorization');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', 'http://'+host+':'+port);
    res.header('Access-Control-Max-Age', 1800);
    res.header('Content-Type', 'application/json');
    if ('OPTIONS' === req.method) {
        res.sendStatus(200);
    }
    else {
        res.header('Authorization', 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AZ21haWwuY29tIiwibmFtZSI6IkpvaG4iLCJyb2xlIjoiUk9MRV9BRE1JTiIsImFjdFRpbWUiOjk5OTAwMDAwMCwianRpIjoiYzUyNjNiMDUtY2YyMC00OTgwLTkwOWItZTRhMjg4M2Y2MDVjIiwiZXhwIjoxNTU4OTk1NTAxfQ.XbN6cuBxSHHysIh1TIkuCVAJR2UyJ9LCaA0HXbUOG0KVRX1njTANpZPet5VvbeqABUtxE0bxtlM7XsOEEAn-cg');
        next();
    }
};
mockServer.use(middleware);

mockServer.use(jsonServer.bodyParser);

let authUser = {email: 'admin@gmail.com', password: '1234'};

let users = [
    {
        "id": 1,
        "email": "user@gmail.com",
        "password": '1234',
        "activity": {
            "request_time": new Date().toDateString()
        },
        "userGroup": {
            "id": 2,
            "name": "user",
            "description": "Ut aliquam, turpis ac efficitur fringilla, odio velit volutpat ipsum, id facilisis lorem dolor bibendum orci. Quisque consectetur justo vitae maximus consequat.",
            "icon": "https://img.etsystatic.com/il/8decf5/1154652442/il_340x270.1154652442_8npq.jpg?version=1",
            "permissions": [{
                "name":"connections",
                "actions": ["create", "delete", "update"]
            },{
                "name":"transactions",
                "actions": ["create", "delete"]
            },{
                "name":"transactions",
                "actions": ["create", "delete"]
            },{
                "name":"transactions",
                "actions": ["create", "delete"]
            },{
                "name":"transactions",
                "actions": ["create", "delete"]
            },{
                "name":"transactions",
                "actions": ["create", "delete"]}
            ]},
        "userDetail": {
            "name": "Jack",
            "surname": "Sparrow",
            "phoneNumber": "+49 1577 4544545",
            "department": "Parliamentarian",
            "organization": "Pirat",
            "salutation": "Beute",
            "photo_s": "https://avatar-cdn.atlassian.com/1895ea9f4e99e08163111796002a9fb8?s=48&d=https%3A%2F%2Fsecure.gravatar.com%2Favatar%2F1895ea9f4e99e08163111796002a9fb8%3Fd%3Dmm%26s%3D48%26noRedirect%3Dtrue",
            "photo": "https://ca.slack-edge.com/T5966EUGK-U58J37MTJ-ecd9b8afa0d9-72"}
    },{
        "id": 2,
        "email": "admin@gmail.com",
        "password": '1234',
        "activity": {
            "request_time": new Date().toDateString()
        },
        "userGroup": {
            "id": 1,
            "name": "admin","description": "Ut aliquam, turpis ac efficitur fringilla, odio velit volutpat ipsum, id facilisis lorem dolor bibendum orci. Quisque consectetur justo vitae maximus consequat.",
            "icon": "https://img.etsystatic.com/il/8decf5/1154652442/il_340x270.1154652442_8npq.jpg?version=1",
            "permissions": [{
                "name":"USER",
                "actions": ["create", "delete", "update"]
            },{
                "name":"TRANSACTION",
                "actions": ["create", "delete"]}
            ]
        },
        "userDetail": {
            "name": "Clark",
            "surname": "Kent",
            "phoneNumber": "+99830 302 03 23",
            "department": "Crypton",
            "organization": "Justice ligue",
            "salutation": "Justice demand retrebution",
            "photo_s": "https://avatar-cdn.atlassian.com/0055adb92bb3d6b6e9459d1e19f285d8?s=48&d=https%3A%2F%2Fsecure.gravatar.com%2Favatar%2F0055adb92bb3d6b6e9459d1e19f285d8%3Fd%3Dmm%26s%3D48%26noRedirect%3Dtrue"}
    },{
        "id": 3,
        "email": "bob@gmail.com",
        "password": '1234',
        "activity": {
            "request_time": new Date().toDateString()
        },
        "userGroup": {
            "name": "user",
            "permissions": [{
                "name":"connections",
                "actions": ["create", "delete", "update"]
            },{
                "name":"transactions",
                "actions": ["create", "delete"]}
            ]},
        "userDetail": {
            "name": "Mr.",
            "surname": "Bob",
            "phoneNumber": null,
            "department": "Parliamentarian",
            "organization": "Pirat",
            "salutation": "Beute",
            "photo_s": "https://scontent-frx5-1.xx.fbcdn.net/v/t1.0-9/10394090_790066334414561_8228834296837747739_n.jpg?_nc_cat=0&oh=ddaf4b203ff77f1122e43336e508a55c&oe=5BBB209D"}
    },{
        "id": 4,
        "email": "dannyd@gmail.com",
        "password": '1234',
        "activity": {
            "request_time": new Date().toDateString()
        },
        "userGroup": {
            "name": "admin",
            "permissions": [{
                "name":"USER",
                "actions": ["create", "delete", "update"]
            },{
                "name":"TRANSACTION",
                "actions": ["create", "delete"]}
            ]
        },
        "userDetail": {
            "name": "Danny",
            "surname": "Devito",
            "phoneNumber": "+99830 302 03 23",
            "department": "Crypton",
            "organization": "Justice ligue",
            "salutation": "Justice demand retrebution",
            "photo_s": "https://scontent-frx5-1.xx.fbcdn.net/v/t1.0-9/13466125_788623561238022_885480265841765174_n.jpg?_nc_cat=0&oh=1f85601508a99559157562e002eae7aa&oe=5B7AD5FE"}
    },{
        "id": 5,
        "email": "iron@man.com",
        "password": '1234',
        "activity": {
            "request_time": new Date().toDateString()
        },
        "userGroup": {
            "name": "admin",
            "permissions": [{
                "name":"USER",
                "actions": ["create", "delete", "update"]
            },{
                "name":"TRANSACTION",
                "actions": ["create", "delete"]}
            ]
        },
        "userDetail": {
            "name": "Tony",
            "surname": "Stark",
            "phoneNumber": "+99830 302 03 23",
            "department": "Crypton",
            "organization": "Justice ligue",
            "salutation": "Justice demand retrebution",
            "photo_s": "https://scontent-frx5-1.xx.fbcdn.net/v/t1.0-9/525586_10151347773858791_1768833233_n.jpg?_nc_cat=0&oh=c5f42989da305a7b85b3f54423fe0440&oe=5B7ABF09"}
    },{
        "id": 6,
        "email": "user@gmail.com",
        "password": '1234',
        "activity": {
            "request_time": new Date().toDateString()
        },
        "userGroup": {
            "name": "user",
            "permissions": [{
                "name":"connections",
                "actions": ["create", "delete", "update"]
            },{
                "name":"transactions",
                "actions": ["create", "delete"]}
            ]},
        "userDetail": {
            "name": "Jack",
            "surname": "Sparrow",
            "phoneNumber": null,
            "department": "Parliamentarian",
            "organization": "Pirat",
            "salutation": "Beute",
            "photo_s": "https://avatar-cdn.atlassian.com/1895ea9f4e99e08163111796002a9fb8?s=48&d=https%3A%2F%2Fsecure.gravatar.com%2Favatar%2F1895ea9f4e99e08163111796002a9fb8%3Fd%3Dmm%26s%3D48%26noRedirect%3Dtrue"}
    },{
        "id": 7,
        "email": "admin@gmail.com",
        "password": '1234',
        "activity": {
            "request_time": new Date().toDateString()
        },
        "userGroup": {
            "name": "admin",
            "permissions": [{
                "name":"USER",
                "actions": ["create", "delete", "update"]
            },{
                "name":"TRANSACTION",
                "actions": ["create", "delete"]}
            ]
        },
        "userDetail": {
            "name": "Clark",
            "surname": "Kent",
            "phoneNumber": "+99830 302 03 23",
            "department": "Crypton",
            "organization": "Justice ligue",
            "salutation": "Justice demand retrebution",
            "photo_s": "https://avatar-cdn.atlassian.com/0055adb92bb3d6b6e9459d1e19f285d8?s=48&d=https%3A%2F%2Fsecure.gravatar.com%2Favatar%2F0055adb92bb3d6b6e9459d1e19f285d8%3Fd%3Dmm%26s%3D48%26noRedirect%3Dtrue"}
    },{
        "id": 8,
        "email": "bob@gmail.com",
        "password": '1234',
        "activity": {
            "request_time": new Date().toDateString()
        },
        "userGroup": {
            "name": "user",
            "permissions": [{
                "name":"connections",
                "actions": ["create", "delete", "update"]
            },{
                "name":"transactions",
                "actions": ["create", "delete"]}
            ]},
        "userDetail": {
            "name": "Mr.",
            "surname": "Bob",
            "phoneNumber": null,
            "department": "Parliamentarian",
            "organization": "Pirat",
            "salutation": "Beute",
            "photo_s": "https://scontent-frx5-1.xx.fbcdn.net/v/t1.0-9/10394090_790066334414561_8228834296837747739_n.jpg?_nc_cat=0&oh=ddaf4b203ff77f1122e43336e508a55c&oe=5BBB209D"}
    },{
        "id": 9,
        "email": "dannyd@gmail.com",
        "password": '1234',
        "activity": {
            "request_time": new Date().toDateString()
        },
        "userGroup": {
            "name": "admin",
            "permissions": [{
                "name":"USER",
                "actions": ["create", "delete", "update"]
            },{
                "name":"TRANSACTION",
                "actions": ["create", "delete"]}
            ]
        },
        "userDetail": {
            "name": "Danny",
            "surname": "Devito",
            "phoneNumber": "+99830 302 03 23",
            "department": "Crypton",
            "organization": "Justice ligue",
            "salutation": "Justice demand retrebution",
            "photo_s": "https://scontent-frx5-1.xx.fbcdn.net/v/t1.0-9/13466125_788623561238022_885480265841765174_n.jpg?_nc_cat=0&oh=1f85601508a99559157562e002eae7aa&oe=5B7AD5FE"}
    },{
        "id": 10,
        "email": "iron@man.com",
        "password": '1234',
        "activity": {
            "request_time": new Date().toDateString()
        },
        "userGroup": {
            "name": "admin",
            "permissions": [{
                "name":"USER",
                "actions": ["create", "delete", "update"]
            },{
                "name":"TRANSACTION",
                "actions": ["create", "delete"]}
            ]
        },
        "userDetail": {
            "name": "Tony",
            "surname": "Stark",
            "phoneNumber": "+99830 302 03 23",
            "department": "Crypton",
            "organization": "Justice ligue",
            "salutation": "Justice demand retrebution",
            "photo_s": "https://scontent-frx5-1.xx.fbcdn.net/v/t1.0-9/525586_10151347773858791_1768833233_n.jpg?_nc_cat=0&oh=c5f42989da305a7b85b3f54423fe0440&oe=5B7ABF09"}
    }
];

let systems = [
    {
        name: 'I-DoIT',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
        icon: 'http://'+host+':9090/api/storage/files/i-doit-Logo.png',
        credentials: ['api_key'],
        providers: [
            {
                name: 'cmdb.object.update',
                fields: ['id', 'title', 'sysid', 'type', 'type_title', 'status']
            }],
        requesters: [
            {
                name: 'cmdb.objects.read',
                fields: ['object-title']
            }, {
                name: 'cmdb.category.read',
                fields: ['tags', 'hostname', 'ip-address']
            }]
    },{
        name: 'Sensu',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
        icon: 'http://'+host+':9090/api/storage/files/sensu-logo-icon.png',
        credentials: ['api_key'],
        providers: [
            {
                name: 'getHost',
                fields: []
            },{
                name: 'monitorSystem',
                fields: ['Tags', 'Hostname', 'IP-Address']
            }],
        requesters: [
            {
                name: 'ItemConfigSearch',
                fields: []
            }]
    },{
        name: 'OTRS',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
        icon: 'https://otrs.com/wp-content/themes/otrs/assets/img/logo.svg',
        credentials: ['api_key'],
        providers: [
            {
                name: 'ConfigItemUpdate',
                fields: ['name']
            },{
                name: 'ConfigItemCreate',
                fields: ['name']
            }],
        requesters: [
            {
                name: 'ItemConfigSearch',
                fields: []
            }]
    },
];

let connectors = [
    {
        id: 8,
        title: 'Becon.idoit',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
        system: systems[0],
        credentials: {
            url: 'https://i-doit.westeurope.cloudapp.azure.com/src/jsonrpc.php',
            api_key: 'ag8vqhipf'
        }
    },{
        id: 9,
        title: 'Becon.Sensu',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
        system: systems[1],
        credentials: {
            url: 'https://i-doit.westeurope.cloudapp.azure.com/src/jsonrpc.php',
            api_key: 'ag8vqhipf'
        }
    },
    {
        id: 10,
        title: 'Becon.OTRS',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
        system: systems[2],
        credentials: {
            url: 'https://i-doit.westeurope.cloudapp.azure.com/src/jsonrpc.php',
            api_key: 'ag8vqhipf'
        }
    },
];

let transactions = [
    {
        id: 1,
        title: "idoit to OTRS connection",
        description: "Description",
        fromConnector: connectors[0].id,
        toConnector: connectors[1].id,
        connectorAction :
            [
                {
                    connId : connectors[0].id,
                    actionList : [
                        {
                            id : "#ff6a6a",
                            type : "method",
                            name : "cmdb.objects.read",
                            condition : null,
                            fieldList : [
                                {
                                    fieldType : "param",
                                    name : "version",
                                    value : "2.0",
                                    exchangeType : "request",
                                    subFieldList : []
                                },
                                {
                                    fieldType : "param",
                                    name : "method",
                                    value : "cmdb.objects.read",
                                    exchangeType : "request",
                                    subFieldList : []
                                },
                                {
                                    fieldType : "param",
                                    name : "cmdb_status",
                                    value : null,
                                    exchangeType : "response",
                                    subFieldList : []
                                },
                                {
                                    fieldType : "param",
                                    name : "id",
                                    value : null,
                                    exchangeType : "response",
                                    subFieldList : []
                                },
                                {
                                    fieldType : "param",
                                    name : "title",
                                    value : null,
                                    exchangeType : "response",
                                    subFieldList : []
                                }
                            ],
                            bodyAction : []
                        },
                        {
                            id : null,
                            type : "operator",
                            name : "loop",
                            condition : "true",
                            fieldList : [],
                            bodyAction : [
                                {
                                    id : "#556B2F",
                                    type : "method",
                                    name : "cmdb.category.read",
                                    condition : null,
                                    fieldList : [
                                        {
                                            fieldType : "ref",
                                            name : "ids",
                                            value : "$#8B0000.[response].id",
                                            exchangeType : "response",
                                            subFieldList : []
                                        }
                                    ],
                                    bodyAction : []
                                }
                            ]
                        }
                    ]
                },{
                    connId : connectors[1].id,
                    actionList : [
                        {
                            id : "#FF69B4",
                            type : "method",
                            name : "ItemConfigSearch",
                            condition : null,
                            fieldList : [],
                            bodyAction : []
                        },
                        {
                            id : null,
                            type : "operator",
                            name : "if",
                            condition : "true",
                            fieldList : [],
                            bodyAction : [
                                {
                                    id : "#DJ22B1",
                                    type : "method",
                                    name : "ConfigItemUpdate",
                                    condition : null,
                                    fieldList : [
                                        {
                                            fieldType : "param",
                                            name : "name",
                                            value : "title",
                                            exchangeType : "response",
                                            subFieldList : []
                                        }
                                    ],
                                    bodyAction : []
                                }
                            ]
                        },
                        {
                            type : "operator",
                            name : "else",
                            condition : "false",
                            bodyAction : [
                                {
                                    id : "#00BFFF",
                                    type : "method",
                                    name : "ConfigItemCreate",
                                    condition : null,
                                    fieldList : [
                                        {
                                            fieldType : "param",
                                            name : "name",
                                            value : "title",
                                            exchangeType : "response",
                                            subFieldList : []
                                        }
                                    ],
                                    bodyAction : []
                                }
                            ]
                        }
                    ]
                }
            ],
    },{
        id: 2,
        title: "idoit to Sensu connection",
        description: "Description",
        fromConnector: connectors[0].id,
        toConnector: connectors[2].id,
        connectorAction :
            [
                {
                    connId : connectors[0].id,
                    actionList : [
                        {
                            id : "#ff6a6a",
                            type : "method",
                            name : "cmdb.objects.read",
                            condition : null,
                            fieldList : [
                                {
                                    fieldType : "param",
                                    name : "version",
                                    value : "2.0",
                                    exchangeType : "request",
                                    subFieldList : []
                                },
                                {
                                    fieldType : "param",
                                    name : "method",
                                    value : "cmdb.objects.read",
                                    exchangeType : "request",
                                    subFieldList : []
                                },
                                {
                                    fieldType : "param",
                                    name : "cmdb_status",
                                    value : null,
                                    exchangeType : "response",
                                    subFieldList : []
                                },
                                {
                                    fieldType : "param",
                                    name : "id",
                                    value : null,
                                    exchangeType : "response",
                                    subFieldList : []
                                },
                                {
                                    fieldType : "param",
                                    name : "title",
                                    value : null,
                                    exchangeType : "response",
                                    subFieldList : []
                                }
                            ],
                            bodyAction : []
                        },
                        {
                            id : null,
                            type : "operator",
                            name : "loop",
                            condition : "true",
                            fieldList : [],
                            bodyAction : [
                                {
                                    id : "#556B2F",
                                    type : "method",
                                    name : "cmdb.category.read",
                                    condition : null,
                                    fieldList : [
                                        {
                                            fieldType : "ref",
                                            name : "ids",
                                            value : "$#8B0000.[response].id",
                                            exchangeType : "response",
                                            subFieldList : []
                                        }
                                    ],
                                    bodyAction : []
                                }
                            ]
                        }
                    ]
                },{
                connId : connectors[1].id,
                actionList : [
                    {
                        id : "#FF69B4",
                        type : "method",
                        name : "ItemConfigSearch",
                        condition : null,
                        fieldList : [],
                        bodyAction : []
                    },
                    {
                        id : null,
                        type : "operator",
                        name : "if",
                        condition : "true",
                        fieldList : [],
                        bodyAction : [
                            {
                                id : "#DJ22B1",
                                type : "method",
                                name : "ConfigItemUpdate",
                                condition : null,
                                fieldList : [
                                    {
                                        fieldType : "param",
                                        name : "name",
                                        value : "title",
                                        exchangeType : "response",
                                        subFieldList : []
                                    }
                                ],
                                bodyAction : []
                            }
                        ]
                    },
                    {
                        type : "operator",
                        name : "else",
                        condition : "false",
                        bodyAction : [
                            {
                                id : "#00BFFF",
                                type : "method",
                                name : "ConfigItemCreate",
                                condition : null,
                                fieldList : [
                                    {
                                        fieldType : "param",
                                        name : "name",
                                        value : "title",
                                        exchangeType : "response",
                                        subFieldList : []
                                    }
                                ],
                                bodyAction : []
                            }
                        ]
                    }
                ]
            }
            ],
    },
];
let now = Date.now();

let schedules = [
    {
        id: 1,
        transaction: {id: 1, title: 'idoit to OTRS transaction'},
        start_time: now- 3600000*6,
        end_time: now - 3600000*5,
        status: 0,
        color: '#7d8caa',
        period: {
            id: 1,
            title: 'daily'
        }
    },
    {
        id: 2,
        transaction: {id: 2, title: 'idoit to Sensu transaction'},
        start_time: now,
        end_time: now + 900000,
        status: 0,
        color: '#969c6e',
        period: {
            id: 2,
            title: 'weekly'
        }
    },
];

let periods = [
    {
        id: 1,
        title: 'daily'
    },
    {
        id: 2,
        title: 'weekly',
    },
    {
        id: 3,
        title: 'monthly',
    }
];

let usergroups = [
    {id: 1, name: 'Admin', description: 'C.K. role', users: ['Jay', 'Jakob', 'C.K.']},
    {id: 2, name: 'User', description: 'Dummy', users: ['Star Lord']}
];
//authentication
mockServer.post('/login', (req, res) => {
    const {email, password} = req.body;
    if(email === authUser.email && password === authUser.password){
        res.jsonp({success: true});
    } else{
        res.jsonp({success: false, error: {message: 'WRONG_CREDENTIALS'}});
    }

});
//test connector
mockServer.post('/api/connector/test', (req, res) => {
    res.jsonp({success: true});
});
//webhook
mockServer.get('/webhook/url/:userId/:connectionId', (req, res) => {
    setTimeout(() => {res.jsonp({
        id: 1,
        url: 'http://my.webhook/is/here'
    });}, 1000);
});
mockServer.delete('/webhook/url/:id', (req, res) => {
    setTimeout(() => {res.jsonp({
        success: true,
    });}, 1000);
});
//get all
mockServer.get('/api/user/all', (req, res) => {
    let tmpUsers = users;
    for(let i = 0; i < tmpUsers.length; i++){
        if(tmpUsers.password)
            delete tmpUsers.password;
    }
    setTimeout(() => {res.jsonp({
        "_embedded": {
            "userResources": users
        }
    });}, 1000);
});
mockServer.get('/api/usergroup/all', (req, res) => {
    setTimeout(() => {res.jsonp({
        "_embedded": {
            "usergroupResources": usergroups
        }
    });}, 1000);
});
mockServer.get('/api/connector/all', (req, res) => {
    setTimeout(() => {res.jsonp({
        "_embedded": {
            "connectorResources": connectors
        }
    });}, 1000);
});
mockServer.get('/api/system/all', (req, res) => {
    setTimeout(() => {res.jsonp({
        "_embedded": {
            "systemResources": systems
        }
    });}, 1000);
});
mockServer.get('/api/transaction/all', (req, res) => {
    setTimeout(() => {res.jsonp({
        "_embedded": {
            "transactionResources": transactions
        }
    });}, 1000);
});
mockServer.get('/api/schedule/all', (req, res) => {
    setTimeout(() => {res.jsonp({
        "_embedded": {
            "scheduleResources": schedules
        }
    });}, 1000);
});
//get one by id
mockServer.get('/api/user/:id', (req, res) => {
    let user = users.find(elem => elem.id === parseInt(req.params.id));
    if(user) {
        if (user.password)
            delete user.password;
    }
    setTimeout(() => {res.jsonp(user);}, 1000);
});
mockServer.get('/api/usergroup/:id', (req, res) => {
    res.jsonp(usergroups.find(elem => elem.id === parseInt(req.params.id)));
});
mockServer.get('/api/connector/:id', (req, res) => {
    res.jsonp(connectors.find(elem => elem.id === parseInt(req.params.id)));
});
mockServer.get('/api/transaction/:id', (req, res) => {
    res.jsonp(transactions.find(elem => elem.id === parseInt(req.params.id)));
});
mockServer.get('/api/schedule/:id', (req, res) => {
    res.jsonp(schedules.find(elem => elem.id === parseInt(req.params.id)));
});
//delete one
mockServer.delete('/api/user/:id', (req, res) => {
    let index = users.findIndex(elem => elem.id === parseInt(req.params.id));
    users.splice(index, 1);
    res.jsonp({"success": true});
});
mockServer.delete('/api/usergroup/:id', (req, res) => {
    let index = usergroups.findIndex(elem => elem.id === parseInt(req.params.id));
    usergroups.splice(index, 1);
    res.jsonp({"success": true});
});
mockServer.delete('/api/schedule/:id', (req, res) => {
    let index = schedules.findIndex(elem => elem.id === parseInt(req.params.id));
    schedules.splice(index, 1);
    res.jsonp({"success": true});
});
//add one
mockServer.post('/api/user', (req, res) => {
    let data = req.body;
    data['id'] = parseInt(users[users.length - 1]['id']) + 1;
    users.push(data);
    res.jsonp(data);
});
mockServer.post('/api/usergroup', (req, res) => {
    let data = req.body;
    data['id'] = parseInt(usergroups[usergroups.length - 1]['id']) + 1;
    usergroups.push(data);
    res.jsonp(data);
});
mockServer.post('/api/schedule', (req, res) => {
    let data = req.body;
    data['id'] = parseInt(schedules[schedules.length - 1]['id']) + 1;
    data.transaction = transactions.find(transaction => transaction.id === data.transaction);
    data.end_time = data.start_time + 3600000;
    data.status = 0;
    data.period = periods.find(period => period.id === data.period);
    schedules.push(data);
    res.jsonp(data);
});
//update one
mockServer.put('/api/user/:id', (req, res) => {
    /*let index = users.findIndex(elem => elem.id === parseInt(req.params.id));
    users[index].email = req.body.email;
    users[index].password = req.body.password;*/
    res.jsonp(req.body);
});
mockServer.put('/api/usergroup/:id', (req, res) => {
    let index = usergroups.findIndex(elem => elem.id === parseInt(req.params.id));
    usergroups[index] = req.body;
    res.jsonp(req.body);
});
mockServer.put('/api/userDetail/:id', (req, res) => {
    let index = users.findIndex(elem => elem.id === parseInt(req.params.id));
    users[index].userDetail = req.body;
    res.jsonp(req.body);
});
mockServer.put('/api/schedule/status/:id', (req, res) => {
    let index = schedules.findIndex(elem => elem.id === parseInt(req.params.id));
    schedules[index].status = req.body.status;
    res.jsonp(schedules[index]);
});





mockServer.use(data);
mockServer.listen(1000, () => {
    console.log('Mock Server is running');
});


