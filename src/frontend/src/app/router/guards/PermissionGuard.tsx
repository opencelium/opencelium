import { Outlet } from 'react-router-dom'
import {useAuth} from "@features/auth/useAuth.ts";
import {can} from "@shared/permissions/can.ts";
import type {Permission} from "@shared/permissions/types.ts";
import {NoPermissionState} from "@shared/ui/feedback/NoPermissionState";

export function PermissionGuard({ permission }: { permission: Permission }) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) return null

    if (!can({permission, user})) {
        return <NoPermissionState />
    }

    return <Outlet />
}
