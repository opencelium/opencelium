import React, {FC, useState} from 'react';
import {
    ArgumentProps,
} from "./interfaces";
import InputText from "@app_component/base/input/text/InputText";
import InputTextarea from "@app_component/base/input/textarea/InputTextarea";
import Button from "@app_component/base/button/Button";


const Argument:FC<ArgumentProps> =
    ({
        argument,
        id,
        readOnly,
        isAdd,
     }) => {
    const [name, setName] = useState<string>(argument.name || '');
    const [nameError, setNameError] = useState<string>('');
    const [description, setDescription] = useState<string>(argument.description || '');
    const add = () => {
        if(name === ''){
            setNameError('The name is a required field');
            return;
        }
    }
    return (
        <div>
            <InputText
                id={`input_argument_name_${id}`}
                readOnly={readOnly}
                onChange={(e) => setName(e.target.value)}
                value={name}
                icon={'person'}
                label={'Name'}
                error={nameError}
            />
            <InputTextarea
                id={`input_argument_description_${id}`}
                readOnly={readOnly}
                icon={'notes'}
                onChange={(e) => setDescription(e.target.value)}
                value={description}
                label={"Description"}
            />
            {isAdd && <Button
                label={'Add'}
                icon={'add'}
                handleClick={add}
            />}
        </div>
    )
}

export default Argument;
