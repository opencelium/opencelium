import React from 'react';
import type {RouteType} from "@/engine/entity/EntityDefinition.ts";
import {GenericCreatePage} from "@shared/ui/pages/GenericCreatePage.tsx";
import {GenericUpdatePage} from "@shared/ui/pages/GenericUpdatePage.tsx";
import {GenericViewPage} from "@shared/ui/pages/GenericViewPage.tsx";
import {GenericListPage} from "@shared/ui/pages/GenericListPage.tsx";

export function resolvePath(entity: string, type: RouteType) {
    switch (type) {
        case 'create':
            return `/${entity}/create`;
        case 'list':
            return `/${entity}`;
        case 'view':
            return `/${entity}/view/:id`;
        case 'edit':
            return `/${entity}/update/:id`;
        default:
            throw new Error(`Unknown route type: ${type}`);
    }
}
export function resolveElement(entity: string, type: RouteType) {
    switch (type) {
        case 'create':
            return <GenericCreatePage entityName={entity} />;
        case 'edit':
            return <GenericUpdatePage entityName={entity} />;
        case 'view':
            return <GenericViewPage entityName={entity} />;
        case 'list':
            return <GenericListPage entityName={entity} />;
        default:
            throw new Error(`Unknown route type: ${type}`);
    }
}
export function resolveLayout(type: RouteType) {
    switch (type) {
        case 'create':
        case 'list':
        case 'view':
        case 'edit':
            return 'app';
        default:
            return 'app';
    }
}
