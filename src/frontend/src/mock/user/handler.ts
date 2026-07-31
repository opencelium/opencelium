import { http, HttpResponse } from 'msw'

import {randomId} from "@/mock/utils/help.ts";
import userGroups from "@/mock/user/userGroups.ts";
import usersData from "@/mock/user/users.ts";

let users = [...usersData];
export const userHandlers = [
    http.get('/user/:id', ({ params }) => {
        const user = users.find((u) => u.userId === Number(params.id))
        if (!user) return HttpResponse.json({ message: 'User not found' }, { status: 404 })
        return HttpResponse.json(user)
    }),


    http.get('http://localhost:5173/users', ({ request }) => {
        const url = new URL(request.url);

        const page = Number(url.searchParams.get('page') ?? 1);
        const limit = Number(url.searchParams.get('limit') ?? 10);
        const search = (url.searchParams.get('search') ?? '').toLowerCase();

        let filtered = users;

        // 🔍 search
        if (search) {
            filtered = users.filter((u) =>
                u.email.toLowerCase().includes(search)
            );
        }

        const total = filtered.length;

        // 📄 pagination (after filtering!)
        const start = (page - 1) * limit;
        const end = start + limit;

        const paginated = filtered.slice(start, end);

        return HttpResponse.json({
            data: paginated,
            total,
        });
    }),

    http.get('/users/email/:email', async ({ params, request }) => {
        return HttpResponse.json(
            users.find((u) => u.email === params.email),
        )
    }),

    http.post('/users', async ({ request }) => {
        const body = await request.json()
        const newUser = {
            id: randomId(),
            ...body,
            userGroup: userGroups.find(u => u.groupId === body.userGroup),
        }
        users.push(newUser)
        return HttpResponse.json(newUser)
    }),


    http.put('/user/list/totp/enable', async ({ request }) => {
        const body = (await request.json()) as { identifiers?: Array<string | number> };
        const ids = (body.identifiers ?? []).map((v) => Number(v));

        users = users.map((u) =>
            ids.includes(u.userId) ? { ...u, totpEnabled: true } : u,
        );

        return HttpResponse.json({ updated: ids.length });
    }),

    http.put('/user/:id/totp/:verb', ({ params }) => {
        const { id, verb } = params as { id: string; verb: string };
        const userId = Number(id);
        const next = verb === 'enable';

        const idx = users.findIndex((u) => u.userId === userId);
        if (idx === -1) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 });
        }

        users[idx] = { ...users[idx], totpEnabled: next };
        return HttpResponse.json(users[idx]);
    }),

    http.put('/user/:identifier', async ({ params, request }) => {
        const { identifier } = params as { identifier: string };
        const body = (await request.json()) as { email?: string; userDetail?: Record<string, unknown> };

        users = users.map((u) =>
            u.email === identifier
                ? {
                    ...u,
                    ...(body.email ? { email: body.email } : {}),
                    userDetail: { ...u.userDetail, ...(body.userDetail ?? {}) },
                }
                : u,
        );

        const updated = users.find((u) => u.email === (body.email ?? identifier));
        if (!updated) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 });
        }
        return HttpResponse.json(updated);
    }),

    http.post('/user/change-password', async ({ request }) => {
        const body = (await request.json()) as {
            currentPassword: string;
            newPassword: string;
            confirmPassword: string;
        };
        if (body.currentPassword !== '1234qwerQ!') {
            return HttpResponse.json(
                {
                    message: 'WRONG_PASSWORD',
                    status: 400,
                    timestamp: Date.now(),
                },
                { status: 400 },
            );
        }
        return HttpResponse.json({}, { status: 200 });
    }),

    http.put('/users/:id', async ({ params, request }) => {
        const { id } = params as { id: string };
        const userId = Number(id);
        const body = await request.json();

        users = users.map((u) =>
            u.userId === userId
                ? {
                    ...u,
                    ...body,
                    userGroup: userGroups.find(
                        (group) => group.groupId === body.userGroup
                    ),
                }
                : u
        );

        const updatedUser = users.find((u) => u.userId === userId);

        if (!updatedUser) {
            return HttpResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return HttpResponse.json(updatedUser);
    }),
]
