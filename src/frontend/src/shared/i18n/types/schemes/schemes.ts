import type {MetaSchema} from "@shared/i18n/types/schemes/meta.scheme.ts";
import type {DashboardSchema} from "@shared/i18n/types/schemes/dashboard.scheme.ts";
import type {AuthSchema} from "@shared/i18n/types/schemes/auth.scheme.ts";

export interface I18nSchema extends MetaSchema, DashboardSchema, AuthSchema {
    common: {
        welcome: string,
        items: string,
        simple: string,
        importantLabel: string,
        actions: {
            prev: string
            submit: string
            next: string
            create: string
            update: string
            delete: string
            view: string
            download: string
            edit: string
            ctrlEnterHint: string
            cmdEnterHint: string
        }
        copy: {
            tooltip: string
            empty: string
            success: string
            failed: string
        }
        field: {
            required: string
        }
        status: {
            loading: string
            empty: string
        }
        credentialEditor: {
            updateWithoutMasterPassword: string
            masterPasswordNotConfigured: string
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
            entity: string
        }
        onlineFeature: {
            offline: string
            syncDisabled: string
            portalUnreachable: string
        }
        accessDenied: {
            title: string
            subtitle: string
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
            backToMain: string
        }
        commandPalette: {
            placeholder: string
            placeholderShort: string
            noResults: string
            groups: {
                workflow: string
                recent: string
                navigate: string
                create: string
                manage: string
                system: string
                general: string
                ai: string
                aiSuggested: string
            }
            ai: {
                ask: string
                askHint: string
                thinking: string
                run: string
                finish: string
                edit: string
                confirmFirst: string
                choose: string
                notFound: string
                needsValue: string
                noCommand: string
                unreachable: string
                failed: string
                retry: string
            }
            voice: {
                start: string
                listening: string
                transcribing: string
                noSpeech: string
                denied: string
                failed: string
            }
            wakeWord: {
                start: string
                stop: string
                autoStopped: string
                state: {
                    off: string
                    idle: string
                    active: string
                    thinking: string
                }
            }
            workflowEdit: {
                added: string
                notEditable: string
                noConnectors: string
                unknownConnector: string
                unknownMethod: string
                noPlace: string
                failed: string
                sameMethod: string
                unknownStep: string
                mappingFailed: string
                noOpenEditor: string
                noFields: string
                unknownField: string
                noFieldNamed: string
                noReference: string
                noScriptDescription: string
                transformationFailed: string
                part: {
                    body: string
                    header: string
                }
                confirm: {
                    title: string
                    message: string
                }
            }
            workflowAssist: {
                testRunning: string
                testUnavailable: string
                noTestRunning: string
                noFailure: string
                notFixable: string
                noFix: string
                noSteps: string
                nothingToUndo: string
                nothingToRedo: string
                cannotSave: string
                deleteWhich: string
                deleted: string
                generateUnavailable: string
                tutorialUnavailable: string
                operatorFailed: string
                ifAdded: string
                ifAddedEmpty: string
                loopAdded: string
                confirmDelete: {
                    title: string
                    message: string
                }
                testStarted: {
                    live: string
                    debug: string
                }
            }
            beebot: {
                capabilities: {
                    intro: string
                    editor: {
                        addMethod: string
                        addIf: string
                        test: string
                        fix: string
                        undo: string
                    }
                    general: {
                        schedules: string
                        createUser: string
                        theme: string
                        help: string
                        check: string
                    }
                }
            }
            descriptions: {
                create: string
                createWorkflow: string
                update: string
                delete: string
                find: string
                list: string
                login: string
                system: string
                checkAiSettings: string
                checkLicense: string
                updateSystemConfig: string
                changeTheme: string
                uploadTemplate: string
                downloadTemplate: string
                uploadInvoker: string
                installOnlineInvokers: string
                downloadInvoker: string
                systemCheck: string
                ldapCheck: string
                workflow: string
                workflowShow: string
                workflowShowUrl: string
                workflowShowHeaders: string
                workflowShowBody: string
                workflowShowTry: string
                workflowShowTransformation: string
                workflowAddMethod: string
                workflowSuggestMapping: string
                workflowApplyTransformation: string
                workflowOpenBody: string
                workflowOpenHeaders: string
                workflowTestRun: string
                workflowStopTest: string
                workflowExplainFailure: string
                workflowFixFailure: string
                workflowApplyFix: string
                workflowExplain: string
                workflowShowLogs: string
                workflowShowProblems: string
                workflowAddOperator: string
                workflowUndo: string
                workflowRedo: string
                workflowSave: string
                workflowDeleteStep: string
                workflowGenerate: string
                workflowStartTutorial: string
                help: string
                onboarding: string
                workflowTutorial: string
                dashboardTour: string
                changelog: string
            }
            footer: {
                select: string
                autocomplete: string
                navigate: string
                close: string
            }
            help: {
                title: string
                subtitle: string
                keyboardTitle: string
                empty: string
                searchPlaceholder: string
                noResults: string
                shortcuts: {
                    open: string
                    voice: string
                    clearScope: string
                }
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
        footer: {
            copyright: string
            copyrightMobile: string
            docsLink: string
            gitLink: string
            landingPageLink: string
            servicePortalLink: string
        }
        topbar: {
            switchToGerman: string
            switchToEnglish: string
            notifications: string
            switchToAdminMenu: string
            switchToMainMenu: string
            profile: string
            createWorkflow: string
            createWorkflowHint: string
            docs: string
            help: string
            startOnboardingTour: string
            startDashboardTour: string
            servicePortal: string
            account: string
            adminMenu: string
            mainMenu: string
            startWorkflowTutorial: string
            changelog: string
        }
        newFeature: {
            label: string
            gotIt: string
            workflowTemplateJsonEdit: {
                description: string
            }
            enhancementScriptSandbox: {
                description: string
            }
            workflowReferenceOperations: {
                description: string
            }
            workflowConnectorHttpMethod: {
                title: string
                description: string
            }
            workflowHeaderUserActions: {
                description: string
            }
            workflowTestMethod: {
                title: string
                description: string
            }
            workflowAiAssistant: {
                title: string
                description: string
            }
            workflowProblems: {
                title: string
                description: string
            }
            sidebarBackToMainMenu: {
                title: string
                description: string
            }
            changelog: {
                title: string
                description: string
            }
        }
        user: {
            unknown: string
        }
        jsonEditor: {
            reset: string
            cancel: string
            apply: string
            forceApply: string
            syntaxError: string
            discard: {
                title: string
                message: string
            }
            mode: {
                tree: string
                raw: string
            }
        }
        assistant: {
            open: string
            title: string
            intro: string
            placeholder: string
            send: string
            newConversation: string
            close: string
            searching: string
            failed: string
            askInPalette: string
        }
        aiResult: {
            undo: string
            undone: string
        }
        aiExpectedTime: {
            range: string
            hint: string
        }
    },
}
