import React, {ChangeEvent, useEffect, useState} from 'react';
import InputText from "@app_component/base/input/text/InputText";
import {useAppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import Button from "@app_component/base/button/Button";
import {Connector} from "@entity/connector/classes/Connector";
import {checkMasterPassword} from "@entity/connector/redux_toolkit/action_creators/ConnectorCreators";
import {MasterPasswordContainer} from "@entity/connector/components/master_password_input/styles";
import {MasterPasswordProps} from "@entity/connector/components/master_password_input/interfaces";

const MasterPasswordInput = ({onSuccess}: MasterPasswordProps) => {
    const dispatch = useAppDispatch();
    const {checkingMasterPassword, error: reduxError} = Connector.getReduxState();
    const [startSending, setStartSending] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [showPrompt, togglePrompt] = useState<boolean>(false);
    const send = () => {
        dispatch(checkMasterPassword(password));
        setStartSending(true);
    }
    useEffect(() => {
        if (startSending) {
            switch(checkingMasterPassword)  {
                case API_REQUEST_STATE.FINISH:
                    setStartSending(false);
                    onSuccess();
                    break;
                case API_REQUEST_STATE.ERROR:
                    setStartSending(false);
                    switch(reduxError.message) {
                        case 'MASTER_PASSWORD_WRONG':
                            setError('The master password is wrong.');
                            break;
                        case 'MASTER_PASSWORD_NOT_EXIST':
                            togglePrompt(true);
                            break;
                    }
                    break;
            }
        }
    }, [checkingMasterPassword])
    if(showPrompt) {
        return (
            <div>
                <p style={{textAlign: 'center'}}>
                    {"Please, set the master password in the"}
                </p>
                <p style={{textAlign: 'center'}}>
                    {"application.yml file to show this information."}
                </p>
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <Button
                        key={'close_prompt_button'}
                        label={'Close'}
                        handleClick={() => togglePrompt(false)}
                    />
                </div>
            </div>
        )
    }
    return (
        <MasterPasswordContainer>
            <InputText
                id={`master_password`}
                autoFocus={true}
                icon={'key'}
                placeholder={'Enter your Master Password'}
                required={true}
                onChange={(e:ChangeEvent<HTMLInputElement>) => {
                    setPassword(e.target.value);
                    setError('');
                }}
                error={error}
                width={300}
            />
            <Button
                style={{height: '35px'}}
                key={'send_button'}
                label={'Send'}
                handleClick={send}
                isLoading={startSending}
            />
        </MasterPasswordContainer>
    )
}

export default MasterPasswordInput;
