import React, {FC, useEffect, useState} from "react";
import {RequiredDataProps, EntryProps} from "./interfaces";
import {AUTH_API_KEY, AUTH_BASIC, AUTH_ENDPOINT, AUTH_TOKEN} from "@entity/invoker/classes/xml/CXmlInvoker";
import RequiredDataEntry from "@entity/invoker/components/required_data/RequiredDataEntry";
import Input from "@app_component/base/input/Input";

const API_KEY_DATA = [
    {key: 'url_1', name: 'url', visibility: {label: 'public', value: 'public'}},
    {key: 'apikey_1', name: 'apikey', visibility: {label: 'public', value: 'public'}},
];
const TOKEN_DATA = [
    {key: 'url_2', name: 'url', visibility: {label: 'public', value: 'public'}},
    {key: 'user_2', name: 'user', visibility: {label: 'public', value: 'public'}},
    {key: 'password_2', name: 'password', visibility: {label: 'protected', value: 'protected'}},
    {key: 'token_2', name: 'token', visibility: {label: 'private', value: 'private'}, value: '%{body.result}'},
];
const BASIC_DATA = [
    {key: 'url_3', name: 'url', visibility: {label: 'public', value: 'public'}},
    {key: 'username_3', name: 'username', visibility: {label: 'public', value: 'public'}},
    {key: 'password_3', name: 'password', visibility: {label: 'protected', value: 'protected'}},
    {key: 'token_3', name: 'token', visibility: {label: 'private', value: 'private'}, value: 'Basic {username:password}'},
];
const ENDPOINT_DATA = [
    {key: 'url_4', name: 'url', visibility: {label: 'public', value: 'public'}},
    {key: 'UserLogin_4', name: 'UserLogin', visibility: {label: 'public', value: 'public'}},
    {key: 'Password_4', name: 'Password', visibility: {label: 'protected', value: 'protected'}},
    {key: 'WebService_4', name: 'WebService', visibility: {label: 'public', value: 'public'}},
];

const RequiredData: FC<RequiredDataProps> = (
    {
        authType,
        setRequiredData,
        initialRequiredData,
    }) => {
    const [index, setIndex] = useState<string>('');
    const [entries, setEntries] = useState<EntryProps[]>([]);
    useEffect(() => {
        switch(authType){
            case AUTH_API_KEY:
                setIndex('1');
                setEntries(API_KEY_DATA);
                break;
            case AUTH_TOKEN:
                setIndex('2');
                setEntries(TOKEN_DATA);
                break;
            case AUTH_BASIC:
                setIndex('3');
                setEntries(BASIC_DATA);
                break;
            case AUTH_ENDPOINT:
                setIndex('4');
                setEntries(ENDPOINT_DATA);
                break;
        }
    }, [authType]);
    useEffect(() => {
        const requiredDataItems = entries.map(entry => {
            if(entry.name !== ''){
                const data: any = {_attributes: {name: entry.name, type: 'string', visibility: entry.visibility.value}};
                if(entry.value){
                    data._text = entry.value;
                }
                return data;
            }
        });
        setRequiredData({item: requiredDataItems})
    }, [entries])
    const updateEntry = (entry: EntryProps) => {
        setEntries(entries.map(e => {
            if(e.key === entry.key){
                return entry;
            }
            return e;
        }))
    }
    const addEntry = (entry: EntryProps) => {
        setEntries([...entries, entry])
    }
    if(entries.length === 0){
        return null;
    }
    return (
        <Input label={'Required Data'} icon={'feed'}>
            <div style={{paddingTop: '25px'}}>
                {entries.map((entry: any, key: number) => {
                return (
                    <RequiredDataEntry hasLabels={key === 0} key={entry.key} entry={entry} updateEntry={updateEntry}/>
                )
                })}
            </div>
            <RequiredDataEntry key={'add'} index={index} mode={'add'} addEntry={addEntry}/>
        </Input>
    );
}

RequiredData.defaultProps = {
    initialRequiredData: null,
}

export default RequiredData;