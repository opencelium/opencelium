import React, {FC, useEffect, useState} from 'react';
import InputText from "@app_component/base/input/text/InputText";
import InputSelect from "@app_component/base/input/select/InputSelect";
import {RequiredDataEntryStyled} from './styles';
import { RequiredDataEntryProps } from './interfaces';
import Button from '@app_component/base/button/Button';
import {TextSize} from "@app_component/base/text/interfaces";

const RequiredDataEntry: FC<RequiredDataEntryProps> =
    ({
        index,
        entry,
        updateEntry,
        addEntry,
        mode,
        hasLabels,
     }) => {
    const [name, setName] = useState<string>(entry?.name || '');
    const [visibility, setVisibility] = useState<any>(entry?.visibility || {label: 'public', value: 'public'});
    const [value, setValue] = useState<string>(entry?.value || '');
    const [validationMessageForName, setValidationMessageForName] = useState<string>('');
    const onBlur = () => {
        if(mode === 'update'){
            updateEntry({key: entry.key, name, visibility, value});
        }
    }
    const add = () => {
        if(name === ''){
            setValidationMessageForName('Name is a required field');
            return;
        }
        setName('');
        setVisibility({label: 'public', value: 'public'});
        setValue('');
        addEntry({key: `${name}_${index}`, name, visibility, value})
    }
    return (
        <RequiredDataEntryStyled>
            <InputText
                id={`required_data_name_${index || entry.key}`}
                minHeight={30}
                label={hasLabels ? 'Name' : ''}
                error={validationMessageForName}
                value={name}
                onChange={(e) => {setValidationMessageForName(''); setName(e.target.value);}}
                onBlur={onBlur}
            />
            <InputSelect
                id={`required_data_visibility_${index || entry.key}`}
                minHeight={30   }
                width={'30%'}
                label={hasLabels ? 'Visibility' : ''}
                value={visibility}
                onChange={(newValue: any) => {
                    if(mode === 'update'){
                        updateEntry({key: entry.key, name, visibility: newValue, value});
                    }
                    setVisibility(newValue);
                }}
                options={[
                    {label: 'public', value: 'public'},
                    {label: 'protected', value: 'protected'},
                    {label: 'private', value: 'private'},
                ]}
            />
            <div style={{display: 'flex', width: '40%', gap: '5px'}}>
                <InputText
                    id={`required_data_value_${index || entry.key}`}
                    minHeight={30}
                    label={hasLabels ? 'Value' : ''}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={onBlur}
                />
                {mode === 'add' && <div><Button icon={'add'} handleClick={add} size={TextSize.Size_12}/></div>}
            </div>
        </RequiredDataEntryStyled>
    )
}

RequiredDataEntry.defaultProps = {
    mode: 'update',
    index: '',
    hasLabels: false,
}

export default RequiredDataEntry;