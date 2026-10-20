import {useState} from 'react'
import {Popover} from 'antd'
import {Button} from '@shared/ui/primitives/Button'
import {Tooltip} from '@shared/ui/primitives/Tooltip'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {EntityAvatar} from '@shared/ui/entity-avatar/EntityAvatar'
import {APP_LANGUAGES} from '@shared/i18n/config/languages'
import {useAppLanguage} from '@features/user/language/useAppLanguage'
import {useMenuSwitch} from '@app/layouts/AppLayout/Sidebar/useMenuSwitch'
import {HelpMenuEntries, MenuDivider, MenuEntry, type HelpTours} from '@app/layouts/AppLayout/TopBar/HelpMenu'
import {MarqueeText} from '@shared/ui/marquee-text/MarqueeText'
import {NewFeature} from '@shared/ui/feedback/NewFeature/NewFeature'
import type {NewFeatureId} from '@shared/ui/feedback/NewFeature/newFeatures'
import {useUserProfile} from './useUserProfile'
import './userActions.css'

/** Compact form of `UserActions`: the profile picture opens one popover holding every user-level action. */
export const UserActionsMenu = ({tours, newFeatureId}: {tours: HelpTours; newFeatureId?: NewFeatureId}) => {
    const {t: tCommon} = useI18n('common')
    const [isOpen, setIsOpen] = useState(false)
    const {profilePicture, displayName, canReadProfile, openProfile} = useUserProfile()
    const {lang, changeLanguage} = useAppLanguage()
    const {toggleMenu, menuLabelKey} = useMenuSwitch()

    const close = () => setIsOpen(false)
    const identity = (
        <span className="topbar-help-menu__item user-actions-menu__identity">
            <EntityAvatar path={profilePicture} fallbackIcon="profile" size={18} fit="cover"/>
            <MarqueeText text={displayName}/>
        </span>
    )

    const trigger = (
        <Button type="text" testId="user-actions-trigger" style={{padding: 2, height: 'auto'}}>
            <EntityAvatar path={profilePicture} fallbackIcon="profile" size={26} fit="cover"/>
        </Button>
    )

    return (
        <Popover
            trigger={['click']}
            open={isOpen}
            onOpenChange={setIsOpen}
            placement="bottomRight"
            arrow={false}
            styles={{container: {padding: 4}}}
            content={
                <div className="topbar-help-menu user-actions-menu" data-testid="user-actions-menu">
                    <div className="user-actions-menu__header">
                        {canReadProfile ? (
                            <Button type="text" onClick={() => { close(); openProfile() }} testId="user-actions-profile">
                                {identity}
                            </Button>
                        ) : (
                            <div className="user-actions-menu__static">{identity}</div>
                        )}
                        <span className="user-actions-menu__language-options">
                            {APP_LANGUAGES.map((option) => (
                                <Button
                                    key={option}
                                    type={option === lang ? 'primary' : 'text'}
                                    onClick={() => void changeLanguage(option)}
                                    testId={`user-actions-language-${option}`}
                                >
                                    {option.toUpperCase()}
                                </Button>
                            ))}
                        </span>
                    </div>
                    <MenuDivider/>
                    <MenuEntry
                        icon="settings"
                        label={tCommon(menuLabelKey)}
                        onClick={() => { close(); toggleMenu() }}
                        testId="user-actions-menu-switch"
                    />
                    <MenuDivider/>
                    <HelpMenuEntries tours={tours} onSelect={close}/>
                </div>
            }
        >
            {/* A real DOM node for Popover's injected click handler and ref — see HelpMenu. */}
            <span style={{display: 'inline-flex'}}>
                {/* The tooltip would sit over the language buttons, so it's dropped while the menu is open. */}
                {isOpen ? trigger : newFeatureId
                    ? <NewFeature id={newFeatureId} tooltip={tCommon('topbar.account')}>{trigger}</NewFeature>
                    : <Tooltip content={tCommon('topbar.account')}>{trigger}</Tooltip>}
            </span>
        </Popover>
    )
}
