import React from 'react'
import { StoreProvider } from '@app/providers/StoreProvider'
import { I18nProvider } from '@app/providers/I18nProvider'
import { NotificationProvider } from '@app/providers/NotificationProvider'
import { AuthProvider } from '@app/providers/AuthProvider'
import {BoundaryProvider} from "@app/providers/BoundaryProvider.tsx";
import {AppCrash} from "@shared/ui/feedback/crash/AppCrash.tsx";
import {ErrorBoundary} from "@shared/errors/boundary/ErrorBoundary.tsx";
import {ApiErrorProvider} from "@app/providers/ApiErrorProvider.tsx";
import { BrowserRouter } from 'react-router'
import {MockAuthProvider} from "@app/providers/MockAuthProvider.tsx";
import {AuthBootstrap} from "@app/providers/AuthBootstrap.tsx";
import {UIProviders} from "@app/providers/ui/UIProviders.tsx";
import { DialogHost } from "@/shared/ui/dialog/DialogHost";
import {SocketProvider} from "@app/providers/SocketProvider";

type Props = {
    children: React.ReactNode
}

export function AppProviders({ children }: Props) {
    const Auth = import.meta.env.DEV
        ? AuthProvider
        : AuthProvider
    return (
        <BrowserRouter>
            <StoreProvider>
                <I18nProvider>
                    <UIProviders>
                        <NotificationProvider>
                            <BoundaryProvider>
                                <ApiErrorProvider>
                                    <ErrorBoundary fallback={<AppCrash />} scope="app">
                                        <Auth>
                                            <AuthBootstrap>
                                                <SocketProvider>
                                                    {children}
                                                </SocketProvider>
                                            </AuthBootstrap>
                                            <DialogHost />
                                        </Auth>
                                    </ErrorBoundary>
                                </ApiErrorProvider>
                            </BoundaryProvider>
                        </NotificationProvider>
                    </UIProviders>
                </I18nProvider>
            </StoreProvider>
        </BrowserRouter>
    )
}
