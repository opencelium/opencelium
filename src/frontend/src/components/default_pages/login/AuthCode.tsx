import React, {useEffect, useState} from 'react';
import InputText from "@app_component/base/input/text/InputText";
import {disableTotp, enableTotp, validateTotp} from "@entity/totp/redux_toolkit/action_creators/TotpCreators";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import Button from "@app_component/base/button/Button";
import {useAppDispatch} from "@application/utils/store";
import Totp from "@entity/totp/classes/Totp";
import {Auth} from "@application/classes/Auth";
import {onEnter, setFocusById} from "@application/utils/utils";

const AuthCode = () => {
    const dispatch = useAppDispatch();
    const {sessionId} = Auth.getReduxState();
    const {validatingTotp} = Totp.getReduxState();
    const [code, setCode] = useState<string>('');
    useEffect(() => {
        setFocusById('code');
    }, []);
    const dispatchLogin = () => {
        dispatch(validateTotp({
            code,
            sessionId,
        }));
    }
    return (
        <div style={{
            marginTop: '50px',
            border: '1px solid #eee',
            padding: '20px 20px 20px 0',
            borderRadius: '6px'
        }}>
            <div style={{display: 'flex', gap: '10px'}}>
                <div style={{width: '100%'}}>
                    <InputText
                        id={'code'}
                        icon={'123'}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        label={'Auth App Code'}
                        onKeyDown={(e) => onEnter(e, dispatchLogin)}
                    />
                </div>
                <div style={{alignContent: 'center'}}>
                    <Button
                        key={'enable_button'}
                        label={'Login'}
                        isDisabled={!code}
                        handleClick={() => dispatchLogin()}
                        isLoading={validatingTotp === API_REQUEST_STATE.START}
                    />
                </div>
            </div>
        </div>
    )
}

export default AuthCode;
