import { CommandNode } from './types';
import {MockAuthStrategy} from "@features/auth/strategies/MockAuthStrategy.ts";
import {authActions} from "@entities/auth/model/authSlice.ts";
import {store} from "@app/store/store.ts";
import {EntityWizard} from "@/engine/entity/runtime/EntityWizard.tsx";

export const systemCommands: CommandNode<any>[] = [
    //switch role
    {
        value: 'login',
        type: 'literal',
        aliases: ['impersonate', 'auth'],
        group: 'system',
        icon: 'login',
        description: 'commandPalette.descriptions.login',
        children: [
            {
                value: 'as',
                type: 'literal',
                children: [
                    {
                        name: 'role',
                        type: 'entity',
                        // Can be hard-coded or resolved from the available roles
                        resolve: async () => ['admin', 'reporter', 'viewer'],
                        execute: async ({ role }, ctx) => {
                            const confirmed = await ctx.confirm(`Switch to ${role}?`);
                            if (!confirmed) return;

                            try {
                                // Use MockAuthStrategy directly or via dispatch
                                // Since we have access to store.dispatch:
                                const strategy = new MockAuthStrategy();
                                const session = await strategy.login({ role });

                                store.dispatch(authActions.setSession(session));
                            } catch (e) {
                                ctx.notify(`Failed to login as ${role}`, 'error');
                            }
                        },
                    },
                ],
            },
        ],
    },
    // @shared/command/systemCommands.ts
    {
        type: 'literal',
        value: 'system',
        group: 'system',
        icon: 'settings',
        description: 'commandPalette.descriptions.system',
        children: [
            {
                type: 'literal',
                value: 'generate-entity',
                execute: (_, ctx) => {
                    ctx.render(
                        <EntityWizard
                            entityName="MetaEntity"
                            mode="create"
                            onSubmit={async (data) => {
                                // Send data to our local Node.js server
                                const response = await fetch('http://localhost:3001/api/generate-entity', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        name: data.name,
                                        definition: {
                                            ...data,
                                            // Logic for converting the flat form data
                                            // into a complex EntityDefinition object goes here
                                        }
                                    })
                                });
                                if (response.ok) alert('Entity generated! Vite will reload.');
                            }}
                        />
                    );
                }
            }
        ]
    }
];
