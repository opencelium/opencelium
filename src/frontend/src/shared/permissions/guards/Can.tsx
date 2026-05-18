import React from "react";
import type {Permission} from "@shared/permissions/types.ts";
import {can} from "@shared/permissions/can.ts";
import { useAuth } from "@/features/auth/useAuth";

type CanProps = {
    permission: Permission
    entity?: unknown
    children: React.ReactNode
}

export function Can({ permission, entity, children }: CanProps) {

    const { user } = useAuth()

    return can({ permission, user, entity }) ? <>{children}</> : null
}
