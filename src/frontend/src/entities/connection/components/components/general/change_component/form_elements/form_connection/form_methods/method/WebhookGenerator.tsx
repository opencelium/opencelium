import { Connection } from '@entity/connection/classes/Connection';
import React, {useState} from 'react';
import {useAppDispatch} from "@application/utils/store";
import Select from "@basic_components/inputs/Select";
import Button from "@basic_components/buttons/Button";
import {addWebhook} from "@root/redux_toolkit/slices/ConnectionSlice";

const WebhookGenerator = ({value, onSelect}: {value: string, onSelect: (webhook: string) => void}) => {
    const dispatch = useAppDispatch();
    const {webhooks} = Connection.getReduxState();
    const [inputValue, setInputValue] = useState<string>('');
    const [currentWebhook, setWebhook] = useState(value ? {label: value, value} : null);
    const source = webhooks.map(w => {return {label: w, value: w}})
    const onChange = (webhook: any) => {
        setWebhook(webhook);
        onSelect(webhook.value)
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
                options={source.length > 0 ? source : [{label: 'No params', value: 0, color: 'white'}]}
                closeOnSelect={false}
                placeholder={'...'}
                isSearchable={true}
                openMenuOnClick={true}
                maxMenuHeight={200}
                minMenuHeight={50}
                noOptionsMessage={() => <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left'}}>
                    <span>{"Webhook does not exist"}</span>
                    <Button title={'Add'} handleClick={() => dispatch(addWebhook(inputValue))}/>
                </div>}
        />
        </div>
    );
}

export default WebhookGenerator;
