import type {User} from "@entities/user/model/types.ts";

export const usersMock: User[] = [
    {
        id: '1',
        email: 'alice@example.com',
        status: 'active',
        firstname: 'Alice',
        lastname: 'Samuel',
        roles: ['admin']
    },
    {
        id: '2',
        status: 'inactive',
        email: 'john@example2.com',
        firstname: 'John',
        lastname: 'Nick',
        roles: ['admin']
    },
];
