import {CommandPalette} from "@widgets/CommandPalette/CommandPalette.tsx";
import React from "react";
import {useNavigate} from "react-router-dom";
import {Typography} from "@shared/ui/primitives/Typography";
import {DesktopOutlined, NotificationOutlined, PieChartOutlined, UserOutlined,} from "@ant-design/icons";
import logoImage from "@assets/images/logo_oc_white.png";
import {useBreakpoints} from "@app/hooks/useBreakpoints.tsx";
import {Button} from "@shared/ui/primitives/Button";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import {IconButton} from "@shared/ui/primitives/IconButton";
import {Tooltip} from "@shared/ui/primitives/Tooltip";
import {MenuSwitcher} from "@app/layouts/AppLayout/Sidebar/MenuSwitcher.tsx";

export const TopBar = () => {
    const {isTabletOrMobile, isMobile} = useBreakpoints();
    const {setLang, lang} = useI18n();
    const {t: tCommon} = useI18n('common');
    const navigate = useNavigate();
    return (
        <div
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                margin: '0 24px 0 4px',
            }}
        >
            {/* LEFT */}
            <div style={{display: 'flex', alignItems: 'center'}}>
                {!isTabletOrMobile && (
                    <Typography variant="title">
                        OpenCelium v5.0
                    </Typography>
                )}
            </div>

            {/* CENTER (true center) */}
            <div
                style={{
                    position: isMobile ? 'relative' : 'absolute',
                    left: isMobile ? 'unset' : '50%',
                    transform: isMobile ? 'unset' : 'translateX(-50%)',
                    width: '100%',
                    maxWidth: 600,
                    pointerEvents: 'none', // optional
                    zIndex: 1,
                }}
            >
                <div style={{pointerEvents: 'auto'}}>
                    <CommandPalette/>
                </div>
            </div>

            {/* RIGHT */}
            <div
                style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >

                <Tooltip content={tCommon(lang === 'en' ? 'topbar.switchToGerman' : 'topbar.switchToEnglish')}>
                    <Button
                        type={'text'}
                        onClick={() => setLang(lang === 'en' ? 'de' : 'en')}
                    >
                        {lang.toUpperCase()}
                    </Button>
                </Tooltip>
                <Tooltip content={tCommon('topbar.notifications')}>
                    <IconButton
                        size="xs"
                        type={'text'}
                        iconProps={{name: 'notification', color: 'primary'}}
                        onClick={() => {}}
                    />
                </Tooltip>
                <MenuSwitcher/>
                <Tooltip content={tCommon('topbar.profile')}>
                    <IconButton
                        size="xs"
                        type={'text'}
                        iconProps={{name: 'profile', color: 'primary'}}
                        onClick={() => navigate('/profile')}
                    />
                </Tooltip>
            </div>
        </div>
    );
};
