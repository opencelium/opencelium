import React, {ChangeEvent, useEffect, useState} from 'react';
import InputText from "@app_component/base/input/text/InputText";
import {useAppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import Button from "@app_component/base/button/Button";
import {Connector} from "@entity/connector/classes/Connector";
import {
    checkMasterPassword,
    existMasterPassword
} from "@entity/connector/redux_toolkit/action_creators/ConnectorCreators";
import {MasterPasswordContainer, PromptContainer} from "@entity/connector/components/master_password_input/styles";
import {MasterPasswordProps} from "@entity/connector/components/master_password_input/interfaces";
import {onEnter, setFocusById} from "@application/utils/utils";
import {InputTextType} from "@app_component/base/input/text/interfaces";

const MasterPasswordInput = ({onSuccess}: MasterPasswordProps) => {
    const dispatch = useAppDispatch();
    const {checkingMasterPassword, error: reduxError, existingMasterPassword, existMasterPasswordResponse} = Connector.getReduxState();
    const [startSending, setStartSending] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [showPrompt, togglePrompt] = useState<boolean>(false);
    const send = () => {
        dispatch(checkMasterPassword(password));
        setStartSending(true);
    }
    useEffect(() => {
        dispatch(existMasterPassword());
    }, []);
    useEffect(() => {
        switch(existingMasterPassword) {
            case API_REQUEST_STATE.FINISH:
                if (!existMasterPasswordResponse.result) {
                    togglePrompt(true);
                }
                break;
            case API_REQUEST_STATE.ERROR:
                togglePrompt(true);
                break;
        }
    }, [existingMasterPassword]);
    useEffect(() => {
        if (startSending) {
            switch(checkingMasterPassword)  {
                case API_REQUEST_STATE.FINISH:
                    setStartSending(false);
                    onSuccess();
                    break;
                case API_REQUEST_STATE.ERROR:
                    setStartSending(false);
                    switch(reduxError?.message) {
                        case 'MASTER_PASSWORD_WRONG':
                            if (password !== '') {
                                setError('The master password is wrong.');
                            }
                            break;
                        case 'MASTER_PASSWORD_NOT_EXIST':
                            togglePrompt(true);
                            break;
                    }
                    break;
            }
        }
    }, [checkingMasterPassword])
    useEffect(() => {
        if (showPrompt) {
            setFocusById('close_prompt_button');
        }
    }, [showPrompt]);
    if(showPrompt) {
        return (
            <PromptContainer>
                <p style={{textAlign: 'center'}}>
                    {"We could not find a master password. To show this information,"}
                </p>
                <p style={{textAlign: 'center'}}>
                    {"please set the master password in the application.yml file."}
                </p>
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <Button
                        id={'close_prompt_button'}
                        label={'Close'}
                        handleClick={() => togglePrompt(false)}
                    />
                </div>
            </PromptContainer>
        )
    }
    return (
        <MasterPasswordContainer>
            <div style={{width: '300px'}}>
                <InputText
                    id={`master_password`}
                    autoFocus={true}
                    icon={'key'}
                    type={InputTextType.Password}
                    placeholder={'Enter your Master Password'}
                    required={true}
                    onKeyDown={(e) => onEnter(e, send)}
                    onChange={(e:ChangeEvent<HTMLInputElement>) => {
                        setPassword(e.target.value);
                        setError('');
                    }}
                    error={error}
                />
            </div>
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
