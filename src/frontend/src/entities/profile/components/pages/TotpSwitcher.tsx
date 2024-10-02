import React, {useEffect, useState} from 'react';
import QRCode from "react-qr-code";
import InputSwitch from "@app_component/base/input/switch/InputSwitch";
import {useAppDispatch} from "@application/utils/store";
import Button from "@app_component/base/button/Button";
import {disableTotp, enableTotp, generateQRCode} from "@entity/totp/redux_toolkit/action_creators/TotpCreators";
import Totp from "@entity/totp/classes/Totp";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import InputText from "@app_component/base/input/text/InputText";

const TotpSwitcher = () => {
    const dispatch = useAppDispatch();
    const {generatingQRCode, togglingTotp, qrCode, secretKey} = Totp.getReduxState();
    const [code, setCode] = useState<string>('');
    const [showCodeInput, toggleCodeInput] = useState<boolean>(false);
    let isEnabled = true;
    let alreadySetAuthApp = false;
    const generate = () => {
        dispatch(generateQRCode());
    }
    const toggle = () => {
        toggleCodeInput(true)
        if (!alreadySetAuthApp && !isEnabled) {
            generate();
        }
    }
    useEffect(() => {
        if (togglingTotp === API_REQUEST_STATE.FINISH || togglingTotp === API_REQUEST_STATE.ERROR) {
            toggleCodeInput(false);
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
                {!alreadySetAuthApp && <div>
                    <QRCode value={qrCode}/>
                    <div>{secretKey}</div>
                </div>}
                {showCodeInput &&
                    <div>
                        <InputText
                            icon={'qrcode'}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            readOnly={true}
                            label={'Code'}
                        />
                        <Button
                            key={'enable_button'}
                            label={'Upload'}
                            handleClick={() => {
                                if (isEnabled) {
                                    dispatch(disableTotp({code}));
                                } else {
                                    dispatch(enableTotp({code}));
                                }
                            }}
                            isLoading={togglingTotp === API_REQUEST_STATE.START}
                        />
                    </div>
                }
            </div>
        </div>
    )
}

export default TotpSwitcher;
