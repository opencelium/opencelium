import React, {ChangeEvent, FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import {EditButtonProps} from "@atom/input/json_view/interfaces";
import Button from "@atom/button/Button";
import {TextSize} from "@atom/text/interfaces";
import {ColorTheme} from "../../../general/Theme";
import Dialog from "@atom/dialog/Dialog";
import InputTextarea from "@atom/input/textarea/InputTextarea";
import {isJsonString} from "@utils/app";

const EditButton: FC<EditButtonProps> =
    ({
        readOnly,
        jsonValue,
        editJson,
    }) => {
    const [newJson, setNewJson] = useState(JSON.stringify(jsonValue));
    const [validationMessage, setValidationMessage] = useState<string>('');
    const [showDialog, toggleDialog] = useState<boolean>(false);
    const toggle = () => {
        toggleDialog(!showDialog);
    }
    const edit = () => {
        if(isJsonString(newJson)){
            editJson(JSON.parse(newJson));
            toggle();
        } else{
            setValidationMessage('This is not a valid Json input.')
        }
    }
    useEffect(() => {
        if(showDialog){
            setNewJson(JSON.stringify(jsonValue));
        }
    }, [showDialog])
    let actions = [
        {label: 'Edit', onClick: edit, id: 'edit'},
        {label: 'Cancel', onClick: toggle, id: 'cancel'}
    ];
    if(readOnly){
        actions = [{label: 'Close', onClick: toggle, id: 'close'}]
    }
    return (
        <React.Fragment>
            <Button
                icon={readOnly ? 'visibility' : 'edit'}
                handleClick={toggle}
                position={'absolute'}
                hasBackground={false}
                iconSize={TextSize.Size_16}
                color={ColorTheme.Turquoise}
            />
            <Dialog
                actions={actions}
                active={showDialog}
                toggle={toggle}
                title={'Edit Json'}
            >
                <InputTextarea
                    id={`input_json`}
                    label={'Json'}
                    readOnly={readOnly}
                    icon={'data_object'}
                    error={validationMessage}
                    onChange={(e) => setNewJson(e.target.value)}
                    value={newJson}
                />
            </Dialog>
        </React.Fragment>
    )
}

EditButton.defaultProps = {
}


export {
    EditButton,
};

export default withTheme(EditButton);