import React from "react";
import { DialogProvider } from '@/shared/ui/dialog/DialogContext';
import {KitProvider} from "@app/providers/ui/KitProvider.tsx";
import {ThemeProvider} from "@app/providers/ui/ThemeProvider.tsx";
import {ConfirmDialogProvider} from "@app/providers/ui/ConfirmDialogProvider.tsx";
import {ThemeBridge} from "@app/providers/ui/ThemeBridge.tsx";

type Props = {
    children: React.ReactNode
}

export function UIProviders({ children }: Props) {
    return (
        <KitProvider initialSystem="ant">
            <ThemeProvider initialThemeId="ci-light">
                <ThemeBridge>
                    <ConfirmDialogProvider>
                        {/*
                          DialogProvider holds the dialog stack state at the top of the tree
                          so any component can call useDialog().open(). The renderer
                          (<DialogHost />) is mounted further down — inside <AuthProvider> in
                          AppProviders — so dialog content (e.g. EntityWizard via
                          EntityDialogContent) can resolve useAuth() and other deeper contexts.
                        */}
                        <DialogProvider>
                            {children}
                        </DialogProvider>
                    </ConfirmDialogProvider>
                </ThemeBridge>
            </ThemeProvider>
        </KitProvider>
    )
}
