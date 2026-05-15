import { createElement, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthUser } from '@/entities/auth';
import type { Permission } from '@shared/permissions/types.ts';
import { can } from '@shared/permissions/can.ts';

export function routeGuard(permission: Permission) {
    return function GuardedRoute({ children }: { children: ReactNode }) {
        const user = useAuthUser();

        if (!can({ permission, user })) {
            return createElement(Navigate, { to: '/403' });
        }

        return children;
    };
}
