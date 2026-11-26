import {Button} from '@shared/ui/primitives/Button'
import {Tooltip} from '@shared/ui/primitives/Tooltip'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {useAppLanguage} from './useAppLanguage'

/** Shows the current language and switches to the other one; used in the header and the signed-out footer. */
export const LanguageToggle = ({testId}: {testId: string}) => {
    const {lang, changeLanguage} = useAppLanguage()
    const {t: tCommon} = useI18n('common')
    return (
        <Tooltip content={tCommon(lang === 'en' ? 'topbar.switchToGerman' : 'topbar.switchToEnglish')}>
            <Button
                type="text"
                onClick={() => void changeLanguage(lang === 'en' ? 'de' : 'en')}
                testId={testId}
            >
                {lang.toUpperCase()}
            </Button>
        </Tooltip>
    )
}
