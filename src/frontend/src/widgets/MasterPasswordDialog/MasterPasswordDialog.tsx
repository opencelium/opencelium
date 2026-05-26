import React, {useState} from 'react';
import {Card} from "@shared/ui/primitives/Card";
import {FormInput} from "@shared/ui/form/FormInput";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import {Button} from "@shared/ui/primitives/Button";
import {
    useCheckMasterPasswordMutation,
} from "@widgets/MasterPasswordDialog/api/masterPasswordApi.ts";
import {useAppStore} from "@app/store/app.store.ts";
import AsciiError from "@widgets/MasterPasswordDialog/translations.tsx";
import {Trans} from "react-i18next";

const MasterPasswordDialog = () => {
    const [localPassword, setLocalPassword] = useState<string>('');
    const { t: widgetT } = useI18n('widget')
    const { t: commonT } = useI18n('common')
    const [error, setError] = useState<React.ReactNode>(null);
    const [checkMasterPassword, {isLoading}] = useCheckMasterPasswordMutation();
    const {setMasterPassword} = useAppStore();
    const check = async () => {
        if (localPassword === '') {
            setError(commonT('field.required'));
        } else {
            const isAscii = /^[\x20-\x7E]*$/.test(localPassword);
            if (!isAscii) {
                setError(<AsciiError />)
                return;
            }
            setError('');
            try {
                await checkMasterPassword({masterPassword: localPassword}).unwrap()
                setMasterPassword(localPassword);
            } catch (e) {
                console.log(e)
                setError(widgetT(`masterPassword.error.${e.data.error}`, {defaultValue: widgetT(`masterPassword.error.default`)}))
            } finally {
            }
        }
    }
    const onChangeMasterPassword = (newPassword: string) => {
        setError('');
        setLocalPassword(newPassword)
    }
    return (
        <Card style={{width: 500, height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'anchor-center',
                gap: 10,
                width: 400,
                flex: '1 0'
            }}>
                <FormInput
                    style={{flex: 0.8}}
                    autoFocus
                    name={'password'}
                    type={'password'}
                    label={widgetT('masterPassword.input.label')}
                    info={{
                        title: widgetT('masterPassword.input.info.title'),
                        content: widgetT('masterPassword.input.info.content'),
                    }}
                    error={error}
                    value={localPassword}
                    onChange={(e) => onChangeMasterPassword(e.target.value)}
                />
                <Button style={{alignSelf: !!error ? 'center' : 'flex-end'}} loading={isLoading} htmlType={'button'} onClick={check}>{widgetT('masterPassword.button.label')}</Button>
            </div>
        </Card>
    )
}

export default MasterPasswordDialog;
