import React, {ChangeEvent, FC, useEffect, useState} from 'react';
import InputText from "@atom/input/text/InputText";
import {NameProps} from "@molecule/operation/interfaces";

const Name: FC<NameProps> =
    ({
        ...props
    }) => {
    const [newName, setNewName] = useState(props.operationItem.name || '');
    useEffect(() => {
        setNewName(props.operationItem.name);
    }, [props.operationItem?.name])
    return (
        <InputText
            {...props}
            onChange={(e:ChangeEvent<HTMLInputElement>) => {
                setNewName(e.target.value);
            }}
            onBlur={() => {
                props.operationItem.name = newName;
                props.updateOperation(props.operationItem);
            }}
            value={newName}
        />
    )
}

Name.defaultProps = {
}


export {
    Name,
};