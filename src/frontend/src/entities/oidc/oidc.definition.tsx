import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import { RequireComponentRead } from '@app/router/guards/RequireComponentRead'
import { OidcConfigPage } from '@pages/OidcPage/OidcConfigPage'
import en from '@entities/oidc/i18n/en.json'
import de from '@entities/oidc/i18n/de.json'

const baseKey = 'oidc'
const route = '/oidc/config'

export const oidcDefinition: EntityDefinition = {
    name: baseKey,
    permissionComponent: 'APP',

    routes: [
        {
            type: 'view',
            path: route,
            element: <RequireComponentRead component="APP"><OidcConfigPage /></RequireComponentRead>,
        },
    ],

    i18n: {en, de},

    fields: [],
    sections: [],
    wizard: {steps: []},
}
