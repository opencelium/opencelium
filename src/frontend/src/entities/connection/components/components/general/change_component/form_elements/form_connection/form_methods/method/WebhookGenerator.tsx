import React, {forwardRef, useEffect, useMemo, useState} from 'react';
import {components} from 'react-select';
import { Connection } from '@entity/connection/classes/Connection';
//@ts-ignore
import styles from './styles.scss';
import {useAppDispatch} from "@application/utils/store";
import Select from "@basic_components/inputs/Select";
import Button from "@basic_components/buttons/Button";
import {setWebhook} from "@root/redux_toolkit/slices/ConnectionSlice";
import Dialog from "@basic_components/Dialog";
import Webhook from '@entity/connection/classes/Webhook';
import {capitalize, setFocusById} from "@application/utils/utils";
import InputText from "@app_component/base/input/text/InputText";
import {
    TypeSelectStyled
} from "@change_component/form_elements/form_connection/form_methods/method/WebhookGeneratorStyles";
import {getWebhookTypes} from "@entity/schedule/redux_toolkit/action_creators/WebhookCreators";


const WebhookGenerator = forwardRef(({onSelect, readOnly, style, value}: {onSelect: (webhook: string) => void, readOnly?: boolean, style: any, value?: string}, ref) => {
    const dispatch = useAppDispatch();
    const {webhooks, webhookTypes} = Connection.getReduxState();
    const typeOptions = useMemo(() => {
        return webhookTypes.map(type => {return {label: capitalize(type), value: type, id: type};});
    }, [webhookTypes]);
    const [showDialog, toggleDialog] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [type, setType] = useState<any>(null);
    const [nameError, setNameError] = useState('');
    const [typeError, setTypeError] = useState('');
    const [isAdded, setIsAdded] = useState<boolean>(false);
    const [currentWebhook, setCurrentWebhook] = useState(value ? webhooks.find(w => w.value === value) : null);
    useEffect(() => {
        dispatch(getWebhookTypes());
    }, [])
    useEffect(() => {
        if (showDialog) {
            setFocusById('webhook_name');
        }
    }, [showDialog]);
    useEffect(() => {
        if((value === undefined && !!currentWebhook) || currentWebhook?.value !== value) {
            setCurrentWebhook(value ? webhooks.find(w => w.value === value) : null);
        }
    }, [value])
    useEffect(() => {
        if (isAdded) {
            setCurrentWebhook(webhooks.find(w => Webhook.compareTwoWebhooks(w, {name, type: type.value})) || null);
            const webhookInstance = new Webhook(name, type.value);
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
    const onChangeName = (e: any) => {
        setName(e.target.value);
        setNameError('');
    }
    const onChangeType = (newType: any) => {
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
        const newWebhook = new Webhook(name, type.value);
        dispatch(setWebhook(newWebhook.serialize()))
        setIsAdded(true);
        toggleDialog(false);
    }
    const AddComponent = (props: any) => {
        return (
            <div className={styles.item}>
                <div
                    style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left'}}>
                    <span><b>{"create new"}</b></span>
                    <Button icon={'add'} iconSize={'13px'} handleClick={() => {
                        toggleDialog(true);
                    }}/>
                </div>
            </div>
        );
    };

    const CustomMenuList = (props: any) => {
        return (
            <components.MenuList {...props}>
                <AddComponent />
                {props.children}
            </components.MenuList>
        );
    };
    const options: any[] = [...webhooks];
    return (
        <div style={style}>
            <Select
                id={`param_generator_select_webhook`}
                name={'...'}
                inputValue={inputValue}
                value={currentWebhook}
                onKeyDown={onKeyDown}
                onChange={onChange}
                onInputChange={onChangeInputValue}
                options={options}
                closeOnSelect={false}
                placeholder={'...'}
                isSearchable={true}
                openMenuOnClick={true}
                maxMenuHeight={250}
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
                    MenuList: CustomMenuList,
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
                }}
            />
            <Dialog
                id={'webhook_generator_dialog'}
                actions={[{label: 'Ok', onClick: add, id: 'add_webhook_ok'}, {
                    label: 'Cancel',
                    onClick: () => toggleDialog(false),
                    id: 'add_webhook_cancel'
                }]}
                active={showDialog}
                toggle={() => toggleDialog(!showDialog)}
                title={'Add Webhook'}
            >
                <div>
                    <InputText
                        error={nameError}
                        onChange={onChangeName}
                        value={name}
                        label={'Name'}
                        name={'webhook_name'}
                        id={'webhook_name'}
                        icon={'perm_identity'}
                    />

                    <TypeSelectStyled
                        error={typeError}
                        required={true}
                        label={'Type'}
                        icon={'text_format'}
                        onChange={onChangeType}
                        value={type}
                        options={typeOptions}
                    />
                </div>
            </Dialog>
        </div>
    );
})

export default WebhookGenerator;
