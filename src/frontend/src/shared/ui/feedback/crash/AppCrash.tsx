import {useI18n} from "@shared/i18n/hooks/useI18n.ts";

export function AppCrash() {
    const { t } = useI18n()

    return (
        <>{"App crash"}</>
    )
}
