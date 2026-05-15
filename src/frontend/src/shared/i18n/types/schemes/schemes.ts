import type {MetaSchema} from "@shared/i18n/types/schemes/meta.scheme.ts";
import type {DashboardSchema} from "@shared/i18n/types/schemes/dashboard.scheme.ts";

export interface I18nSchema extends MetaSchema, DashboardSchema {
    common: {
        welcome: string,
        items: string,
        simple: string,
        actions: {
            create: string
            update: string
            delete: string
            view: string
            edit: string
        }
        status: {
            loading: string
            empty: string
        }
        list: {
            searchPlaceholder: string
            empty: string
            actions: string
            manage: string
            deleteSelected: string
            deleteSelectedSuccess: string
            deleteSelectedSuccess_one: string
            filtersTooltip: string
            confirmDelete: {
                title: string
                message: string
                bulkMessage: string
                bulkMessage_one: string
            }
        }
        menu: {
            connectors: string
            connections: string
            schedules: string
            usersAccess: string
            users: string
            groups: string
            ldapCheck: string
            configurations: string
            invokers: string
            connectionTemplates: string
            dataAggregator: string
            notificationTemplates: string
            categories: string
            supportFiles: string
            licenseSystem: string
            licenseManagement: string
            updateAssistant: string
            systemCheck: string
            ui: string
        }
        commandPalette: {
            placeholder: string
            groups: {
                recent: string
                navigate: string
                create: string
                manage: string
                system: string
                general: string
            }
            descriptions: {
                create: string
                update: string
                delete: string
                find: string
                list: string
                login: string
                system: string
                checkLicense: string
            }
            footer: {
                select: string
                autocomplete: string
                navigate: string
                close: string
            }
        }
        sidebar: {
            expand: string
            collapse: string
        }
        topbar: {
            switchToGerman: string
            switchToEnglish: string
            notifications: string
            switchToAdminMenu: string
            switchToMainMenu: string
            profile: string
        }
    },
}
