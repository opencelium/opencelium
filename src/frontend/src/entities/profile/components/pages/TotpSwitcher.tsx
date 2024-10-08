import React, {useEffect, useState} from 'react';
import InputSwitch from "@app_component/base/input/switch/InputSwitch";
import {useAppDispatch} from "@application/utils/store";
import Button from "@app_component/base/button/Button";
import {
    disableTotp,
    enableTotp,
    generateQRCode,
    isTotpExist
} from "@entity/totp/redux_toolkit/action_creators/TotpCreators";
import Totp from "@entity/totp/classes/Totp";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import InputText from "@app_component/base/input/text/InputText";
import {Auth} from "@application/classes/Auth";
import {Image} from "@app_component/base/image/Image";
import Hint from "@app_component/base/hint/Hint";
import {onEnter, setFocusById} from "@application/utils/utils";

const TotpSwitcher = () => {
    const dispatch = useAppDispatch();
    const {authUser} = Auth.getReduxState();
    const {generatingQRCode, togglingTotp, qrCode, secretKey, isExist} = Totp.getReduxState();
    const [code, setCode] = useState<string>('');
    const [showCodeInput, toggleCodeInput] = useState<boolean>(false);
    const [startToggling, start] = useState<boolean>(false);
    const [isEnabled, toggleTotp] = useState<boolean>(authUser?.totpEnabled || false);
    const generate = () => {
        dispatch(generateQRCode());
    }
    const dispatchToggle = () => {
        if (isEnabled) {
            dispatch(disableTotp({code}));
        } else {
            dispatch(enableTotp({code}));
        }
        start(true);
    }
    const toggle = () => {
        toggleCodeInput(true);
        if (!isExist && !isEnabled) {
            generate();
        }
        setFocusById('code')
    }
    useEffect(() => {
        dispatch(isTotpExist());
    }, [])
    useEffect(() => {
        if (togglingTotp === API_REQUEST_STATE.FINISH && startToggling) {
            toggleCodeInput(false);
            toggleTotp(!isEnabled)
            setCode('');
            start(false);
        }
        if (togglingTotp === API_REQUEST_STATE.ERROR) {
            start(false);
        }
    }, [togglingTotp]);
    return (
        <div>
            <InputSwitch
                name={`${isEnabled ? 'Disable' : 'Enable'} Two Factor Authentication`}
                icon={'security'}
                label={'Security'}
                isChecked={isEnabled}
                isLoading={generatingQRCode === API_REQUEST_STATE.START || showCodeInput}
                onClick={toggle}
                hasConfirmation={isEnabled}
                confirmationText={'Do you really want to disable Two Factor Authentication?'}
            />
            <div>
                {!isExist && !!qrCode && showCodeInput && <div>
                    <Hint
                        style={{marginLeft: 50}}
                        message={'In order to activate the Two Factor Authentication, please send the code generated by Auth App by means of:'}
                    />
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-evenly',
                    }}>
                        <Image src={qrCode}/>
                        <div style={{alignContent: 'center'}}>{"or"}</div>
                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            <div style={{marginLeft: 35, border: '1px solid #000', padding: '10px', borderRadius: '5px'}}>
                                {secretKey.match(/.{1,4}/g)?.join(' ') || ''}
                            </div>
                        </div>
                    </div>
                </div>}
                {showCodeInput &&
                    <div style={{display: 'flex', gap: 10}}>
                        <div style={{width: '100%'}}>
                            <InputText
                                id={'code'}
                                icon={'123'}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                label={'Auth App Code'}
                                onKeyDown={(e) => onEnter(e, dispatchToggle)}
                            />
                        </div>
                        <div style={{alignContent: 'center'}}>
                            <Button
                                key={'enable_button'}
                                label={isEnabled ? 'Deactivate' : 'Activate'}
                                isDisabled={!code}
                                handleClick={() => dispatchToggle()}
                                isLoading={togglingTotp === API_REQUEST_STATE.START}
                            />
                        </div>
                    </div>
                }
            </div>
        </div>
    )
}

export default TotpSwitcher;