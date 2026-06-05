import React, {useMemo} from 'react';
import {message} from "antd";
import {EntityWizard, type SubmitMeta} from "@/engine/entity/runtime/EntityWizard.tsx";
import PageWrapper from "@pages/PageWrapper/PageWrapper.tsx";
import {useCommandPaletteUIStore} from "@widgets/CommandPalette/command-palette.store.ts";
import {useTheme} from "@shared/theme/hooks/useTheme.tsx";
import {themeRegistry} from "@shared/theme/registry/themeRegistry.ts";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import {CustomThemeSection} from "@pages/UIPage/CustomThemeSection.tsx";

const UIPage = () => {
    const {setTheme, themeId} = useTheme();
    const {mode, setMode} = useCommandPaletteUIStore();
    const {t: tEntities} = useI18n('entities');

    const initialValues = useMemo(
        () => ({theme: themeId, commandMode: mode}),
        [themeId, mode],
    );

    return (
        <PageWrapper>
            <EntityWizard
                entityName={'ui'}
                mode="update"
                initialValues={initialValues}
                liveUpdate
                onSubmit={(formData: any, meta?: SubmitMeta) => {
                    const {commandMode, theme} = formData;
                    switch (meta?.changedField) {
                        case 'theme':
                            if (typeof theme === 'string' && themeRegistry.has(theme)) {
                                setTheme(theme);
                                message.success(tEntities('ui.messages.themeUpdated' as any));
                            }
                            return;
                        case 'commandMode':
                            setMode(commandMode);
                            message.success(tEntities('ui.messages.commandModeUpdated' as any));
                            return;
                    }
                }}
            />
            <div style={{marginTop: 24}}>
                <CustomThemeSection />
            </div>
        </PageWrapper>
    );
};

export default UIPage;
