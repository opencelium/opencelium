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
import RadioButtons from "@basic_components/inputs/RadioButtons";
import Webhook from '@entity/connection/classes/Webhook';
import {capitalize} from "@application/utils/utils";
import InputSelect from "@app_component/base/input/select/InputSelect";
import InputText from "@app_component/base/input/text/InputText";
import {
    TypeSelectStyled
} from "@change_component/form_elements/form_connection/form_methods/method/WebhookGeneratorStyles";
import {getWebhookTypes} from "@entity/schedule/redux_toolkit/action_creators/WebhookCreators";

const sources = ['GET params', 'POST params'];

const WebhookGenerator = forwardRef(({onSelect, readOnly}: {onSelect: (webhook: string) => void, readOnly?: boolean}, ref) => {
    const dispatch = useAppDispatch();
    const {webhooks, webhookTypes} = Connection.getReduxState();
    const typeOptions = useMemo(() => {
        return webhookTypes.map(type => {return {label: capitalize(type), value: type, id: type};});
    }, [webhookTypes]);
    const sourceOptions = useMemo(() => {
        return sources.map(type => {return {label: capitalize(type), value: type, id: type};});
    }, [sources]);
    const [showDialog, toggleDialog] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [type, setType] = useState<any>(null);
    const [source, setSource] = useState<any>(null);
    const [nameError, setNameError] = useState('');
    const [typeError, setTypeError] = useState('');
    const [sourceError, setSourceError] = useState<string>('');
    const [isAdded, setIsAdded] = useState<boolean>(false);
    const [currentWebhook, setCurrentWebhook] = useState(null);
    useEffect(() => {
        dispatch(getWebhookTypes());
    }, [])
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
    const onChangeSource = (newSource: any) => {
        setSource(newSource);
        setSourceError('');
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
        if(!source) {
            setSourceError('Source is a required field');
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
    if (!readOnly) {
        //options.unshift({label: 'add', value: 'add_webhook', component: AddComponent});
    }
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
                        autoFocus
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
                    <InputSelect
                        error={sourceError}
                        required={true}
                        label={'Source'}
                        icon={'source'}
                        onChange={onChangeSource}
                        value={source}
                        options={sourceOptions}
                    />
                    {/*<RadioButtons
                        error={typeError}
                        required={true}
                        label={'Type'}
                        icon={'text_format'}
                        value={type}
                        handleChange={onChangeType}
                        radios={typeOptions}/>*/}
                </div>
            </Dialog>
        </div>
    );
})

export default WebhookGenerator;
