import {Button} from '@shared/ui/primitives/Button'
import {IconButton} from '@shared/ui/primitives/IconButton'
import {Tooltip} from '@shared/ui/primitives/Tooltip'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {EntityAvatar} from '@shared/ui/entity-avatar/EntityAvatar'
import {useAppLanguage} from '@features/user/language/useAppLanguage'
import {MenuSwitcher} from '@app/layouts/AppLayout/Sidebar/MenuSwitcher'
import {HelpMenu, type HelpTours} from '@app/layouts/AppLayout/TopBar/HelpMenu'
import {UserActionsMenu} from './UserActionsMenu'
import {useUserProfile} from './useUserProfile'

type Props = {
    /** `compact` folds everything behind the profile picture, for headers short on width. */
    layout: 'inline' | 'compact'
    /** Which guided tours the help entries offer; defaults to the app-wide ones. */
    tours?: HelpTours
}

/** The user-level header actions (language, help, menu switch, profile) shared by the top bar and the workflow editor. */
export const UserActions = ({layout, tours = 'app'}: Props) => {
    if (layout === 'compact') return <UserActionsMenu tours={tours}/>

    return (
        <div style={{display: 'flex', alignItems: 'center'}}>
            <LanguageToggle/>
            <HelpMenu tours={tours}/>
            <MenuSwitcher/>
            <ProfileButton/>
        </div>
    )
}

const LanguageToggle = () => {
    const {lang, changeLanguage} = useAppLanguage()
    const {t: tCommon} = useI18n('common')
    return (
        <Tooltip content={tCommon(lang === 'en' ? 'topbar.switchToGerman' : 'topbar.switchToEnglish')}>
            <Button
                type="text"
                onClick={() => void changeLanguage(lang === 'en' ? 'de' : 'en')}
                testId="topbar-language"
            >
                {lang.toUpperCase()}
            </Button>
        </Tooltip>
    )
}

const ProfileButton = () => {
    const {profilePicture, canReadProfile, openProfile} = useUserProfile()
    const {t: tCommon} = useI18n('common')
    if (!canReadProfile) return null

    return (
        <Tooltip content={tCommon('topbar.profile')}>
            {profilePicture ? (
                <Button
                    type="text"
                    onClick={openProfile}
                    testId="topbar-profile"
                    style={{padding: 2, height: 'auto'}}
                >
                    <EntityAvatar path={profilePicture} fallbackIcon="profile" size={26} fit="cover"/>
                </Button>
            ) : (
                <IconButton
                    size="xs"
                    type="text"
                    iconProps={{name: 'profile', color: 'primary'}}
                    onClick={openProfile}
                    testId="topbar-profile"
                />
            )}
        </Tooltip>
    )
}
