import {ThemeSwitchButton} from "@shared/ui/system/ThemeSwitchButton.tsx";
import {CommandPalette} from "@widgets/CommandPalette/CommandPalette.tsx";
import {SystemSwitcher} from "@shared/ui/system/SystemSwitcher.tsx";
import React from "react";
import {useAuth} from "@features/auth/useAuth.ts";
import {CommonText} from "@shared/ui/primitives/Text";
import {Switch} from "@shared/ui/primitives/Switch";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import {Button} from "@shared/ui/primitives/Button";
import {ThemeName} from "@shared/theme/types.ts";

export function TopBar() {
    const { user } = useAuth()
    const { setLang, lang } = useI18n()
    return (
        <header
            style={{
                height: 100,
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
            }}
        >

            <div style={{display: 'flex', justifyContent: 'space-around', width: '100%', alignItems: 'center'}}>
                <div style={{width: '30%', display: 'flex', gap: 20, justifyContent: 'start', alignItems: 'center'}}>
                    <ThemeSwitchButton/>
                    <SystemSwitcher/>
                </div>
                <div style={{flex: 1}}>
                    <CommandPalette/>
                </div>
                <div style={{width: '30%', display: 'flex', justifyContent: 'end', alignItems: 'center', gap: 20}}>
                    <CommonText
                        i18nKey="welcome"
                        values={{name: user.name}}
                    />
                    <Button
                        variant="secondary"
                        onClick={() => setLang(lang === 'en' ? 'de' : 'en')}
                    >
                        {lang.toUpperCase()}
                    </Button>
                </div>
            </div>
        </header>
    )
}
