import { Connection } from '@entity/connection/classes/Connection';
import React, {useEffect, useState} from 'react';
import {useAppDispatch} from "@application/utils/store";
import Select from "@basic_components/inputs/Select";
import Button from "@basic_components/buttons/Button";
import {addWebhook} from "@root/redux_toolkit/slices/ConnectionSlice";
import Input from "@basic_components/inputs/Input";
import Dialog from "@basic_components/Dialog";
import {FIELD_TYPE_ARRAY, FIELD_TYPE_OBJECT, FIELD_TYPE_STRING} from "@classes/content/connection/method/CMethodItem";
import RadioButtons from "@basic_components/inputs/RadioButtons";

const WebhookGenerator = ({value, onSelect}: {value: string, onSelect: (webhook: string) => void}) => {
    const dispatch = useAppDispatch();
    const {webhooks} = Connection.getReduxState();
    const [showDialog, toggleDialog] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [type, setType] = useState<string>('');
    const [nameError, setNameError] = useState('');
    const [typeError, setTypeError] = useState('');
    const [isAdded, setIsAdded] = useState<boolean>(false);
    const [currentWebhook, setWebhook] = useState(value ? webhooks.find(w => w.value === value) : null);
    useEffect(() => {
        if (showDialog) {
            setName(inputValue);
        }
    }, [showDialog])
    useEffect(() => {
        if (isAdded) {
            setWebhook(webhooks.find(w => w.value === name) || null);
            onSelect(name)
            toggleDialog(false);
            setIsAdded(false);
        }
    }, [webhooks])
    const onChange = (webhook: any) => {
        if (webhook.label !== 'No params') {
            setWebhook(webhook);
            onSelect(webhook.value)
        }
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
        let label = '';
        switch (type) {
            case FIELD_TYPE_STRING:
                label = name;
                break;
            case FIELD_TYPE_ARRAY:
                label = `${name} (Array)`;
                break;
            case FIELD_TYPE_OBJECT:
                label = `${name} (Object)`;
                break;
        }
        dispatch(addWebhook({
            value: name,
            type: type,
            label,
        }))
        setIsAdded(true);
        toggleDialog(false);
    }
    return (
        <div style={{float: 'left', width: 'calc(100% - 70px)'}}>
            <Select
                id={`param_generator_select_webhook`}
                name={'...'}
                inputValue={inputValue}
                value={currentWebhook}
                onChange={onChange}
                onInputChange={setInputValue}
                options={webhooks.length > 0 ? webhooks : [{label: 'No params', value: 0, color: 'white'}]}
                closeOnSelect={false}
                placeholder={'...'}
                isSearchable={true}
                openMenuOnClick={true}
                maxMenuHeight={200}
                minMenuHeight={50}
                noOptionsMessage={() => <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left'}}>
                    <span>{"Webhook does not exist"}</span>
                    <Button title={'Add'} handleClick={() => toggleDialog(true)}/>
                </div>}
            />
            <Dialog
                actions={[{label: 'Ok', onClick: add, id: 'add_webhook_ok'}, {label: 'Cancel', onClick: () => toggleDialog(false), id: 'add_webhook_cancel'}]}
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
                        autoFocus
                    />
                    <RadioButtons
                        error={typeError}
                        required={true}
                        label={'Type'}
                        icon={'text_format'}
                        value={type}
                        handleChange={onChangeType}
                        radios={[
                            {
                                id: 'add_param_input_type',
                                label: 'String',
                                value: FIELD_TYPE_STRING,
                            },{
                                label: 'Array',
                                value: FIELD_TYPE_ARRAY,
                            },{
                                label: 'Object',
                                value: FIELD_TYPE_OBJECT,
                            }
                        ]}/>
                </div>
            </Dialog>
        </div>
    );
}

export default WebhookGenerator;
