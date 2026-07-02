import type {MetaSchema} from "@shared/i18n/types/schemes/meta.scheme.ts";
import type {DashboardSchema} from "@shared/i18n/types/schemes/dashboard.scheme.ts";
import type {AuthSchema} from "@shared/i18n/types/schemes/auth.scheme.ts";

export interface I18nSchema extends MetaSchema, DashboardSchema, AuthSchema {
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
            ctrlEnterHint: string
        }
        status: {
            loading: string
            empty: string
        }
        credentialEditor: {
            updateWithoutMasterPassword: string
        }
        errorBoundary: {
            retry: string
            reload: string
            app: {
                title: string
                subtitle: string
            }
            page: {
                title: string
                subtitle: string
            }
            widget: {
                title: string
                subtitle: string
            }
        }
        notFound: {
            code: string
            title: string
            subtitle: string
            goBack: string
            goHome: string
        }
        dialog: {
            maximize: string
            restore: string
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
            expandRow: string
            collapseRow: string
            confirmDelete: {
                title: string
                message: string
                bulkMessage: string
                bulkMessage_one: string
            }
        }
        menu: {
            dashboard: string
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
            config: string
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
                updateSystemConfig: string
                changeTheme: string
                uploadTemplate: string
                downloadTemplate: string
                uploadInvoker: string
                downloadInvoker: string
                systemCheck: string
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
            logout: string
            confirmLogout: {
                title: string
                message: string
            }
        }
        topbar: {
            switchToGerman: string
            switchToEnglish: string
            notifications: string
            switchToAdminMenu: string
            switchToMainMenu: string
            profile: string
            createWorkflow: string
        }
    },
}
