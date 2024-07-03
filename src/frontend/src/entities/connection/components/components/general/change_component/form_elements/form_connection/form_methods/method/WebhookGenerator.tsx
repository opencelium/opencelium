import React, {useEffect, useMemo, useState} from 'react';
import {components} from 'react-select';
import { Connection } from '@entity/connection/classes/Connection';
//@ts-ignore
import styles from './styles.scss';
import {useAppDispatch} from "@application/utils/store";
import Select from "@basic_components/inputs/Select";
import Button from "@basic_components/buttons/Button";
import {setWebhook} from "@root/redux_toolkit/slices/ConnectionSlice";
import Input from "@basic_components/inputs/Input";
import Dialog from "@basic_components/Dialog";
import RadioButtons from "@basic_components/inputs/RadioButtons";
import Webhook from '@entity/connection/classes/Webhook';
import {getWebhookTypes} from "@root/redux_toolkit/action_creators/ConnectionCreators";
import {capitalize} from "@application/utils/utils";

const WebhookGenerator = ({value, onSelect}: {value: string, onSelect: (webhook: string) => void}) => {
    const dispatch = useAppDispatch();
    const {webhooks, webhookTypes} = Connection.getReduxState();
    const typeOptions = useMemo(() => {
        return webhookTypes.map(type => {return {label: capitalize(type), value: type, id: type};});
    }, [webhookTypes]);
    const [showDialog, toggleDialog] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [type, setType] = useState<string>('');
    const [nameError, setNameError] = useState('');
    const [typeError, setTypeError] = useState('');
    const [isAdded, setIsAdded] = useState<boolean>(false);
    const [currentWebhook, setCurrentWebhook] = useState(value ? webhooks.find(w => w.value === value) : null);
    const onChangeInputValue = (newInput: string) => {
        if(newInput !== '') {
            setName(newInput);
            setInputValue(newInput);
        }
    }
    const onKeyDown = (e: any) => {
        if (e.code === 'Backspace') {
            if(inputValue.length === 1) {
                setInputValue('');
                setName('');
            }
        }
    }
    useEffect(() => {
        dispatch(getWebhookTypes());
    }, [])
    useEffect(() => {
        if (isAdded) {
            setCurrentWebhook(webhooks.find(w => Webhook.compareTwoWebhooks(w, {name, type})) || null);
            const webhookInstance = new Webhook(name, type);
            onSelect(webhookInstance.value)
            toggleDialog(false);
            setIsAdded(false);
        }
    }, [webhooks])
    const onChange = (webhook: any) => {
        if (webhook.label === 'add' && webhook.value === 'add_webhook') {
            return;
        }
        setCurrentWebhook(webhook);
        onSelect(webhook.value)
    }
    const onChangeName = (newName: string) => {
        setName(newName);
        setNameError('');
    }
    const onChangeType = (newType: string) => {
        setType(newType);
        setTypeError('');
    }
    const add = () => {
        if(!name) {
            setNameError('Name is a required field');
            return;
        }
        if(!type) {
            setTypeError('Type is a required field');
            return;
        }
        const newWebhook = new Webhook(name, type);
        dispatch(setWebhook(newWebhook.serialize()))
        setIsAdded(true);
        toggleDialog(false);
    }
    const AddComponent = (props: any) => {
        return (
            <div className={styles.item}>
                <div
                    style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left'}}>
                    <span>{"If does not exist"}</span>
                    <Button icon={'add'} iconSize={'13px'} handleClick={() => {
                        toggleDialog(true);
                    }}/>
                </div>
            </div>
        );
    };
    const NoOptionsMessage = (props: any) => {
        return (
            <components.NoOptionsMessage {...props}>
                <div style={{ color: 'red' }}>
                    No options found
                </div>
            </components.NoOptionsMessage>
        );
    };
    return (
        <div style={{float: 'left', width: 'calc(100% - 70px)'}}>
            <Select
                id={`param_generator_select_webhook`}
                name={'...'}
                inputValue={inputValue}
                value={currentWebhook}
                onKeyDown={onKeyDown}
                onChange={onChange}
                onInputChange={onChangeInputValue}
                options={[{label: 'add', value: 'add_webhook', component: AddComponent}, ...webhooks]}
                closeOnSelect={false}
                placeholder={'...'}
                isSearchable={true}
                openMenuOnClick={true}
                maxMenuHeight={200}
                minMenuHeight={50}
                filterOption={
                    (candidate: any, input: any) => {
                        if (candidate.value === 'add_webhook' && candidate.label === 'add') {
                            return true;
                        }
                        return candidate.label.toLowerCase().includes(input.toLowerCase());
                    }
                }
                getOptionLabel={(option: any) =>
                    option.component ? option.label : option.label
                }
                getOptionValue={(option: any) =>
                    option.component ? option.value : option.value
                }
                components={{
                    Option: (props: any) => {
                        const Component = props.data.component || components.Option;
                        return <Component {...props} >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    textAlign: 'left'
                                }}
                                title={props.data.label}
                            >
                                <span style={{
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap'
                                }}>{props.data.label}</span>
                            </div>
                        </Component>;
                    },
                    NoOptionsMessage: NoOptionsMessage,
                }}
            />
            <Dialog
                actions={[{label: 'Ok', onClick: add, id: 'add_webhook_ok'}, {
                    label: 'Cancel',
                    onClick: () => toggleDialog(false),
                    id: 'add_webhook_cancel'
                }]}
                active={showDialog}
                toggle={toggleDialog}
                title={'Add Webhook'}
            >
                <div>
                    <Input
                        error={nameError}
                        onChange={onChangeName}
                        value={name}
                        label={'Name'}
                        name={'webhook_name'}
                        id={'webhook_name'}
                        icon={'perm_identity'}
                        autoFocus
                    />
                    <RadioButtons
                        error={typeError}
                        required={true}
                        label={'Type'}
                        icon={'text_format'}
                        value={type}
                        handleChange={onChangeType}
                        radios={typeOptions}/>
                </div>
            </Dialog>
        </div>
    );
}

export default WebhookGenerator;
