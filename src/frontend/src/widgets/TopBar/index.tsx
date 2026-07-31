import {ThemeSwitchButton} from "@shared/ui/system/ThemeSwitchButton.tsx";
import {CommandPalette} from "@widgets/CommandPalette/CommandPalette.tsx";
import {SystemSwitcher} from "@shared/ui/system/SystemSwitcher.tsx";
import React from "react";
import {useAuth} from "@features/auth/useAuth.ts";
import {CommonText} from "@shared/ui/primitives/Text";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import {Button} from "@shared/ui/primitives/Button";

export function TopBar() {
    const { user } = useAuth()
    const { setLang, lang } = useI18n()
    return (
        <header
            data-testid="topbar"
            style={{
                height: 100,
                borderBottom: '1px solid var(--color-border-subtle)',
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
                        testId="topbar-lang-toggle"
                    >
                        {lang.toUpperCase()}
                    </Button>
                </div>
            </div>
        </header>
    )
}
