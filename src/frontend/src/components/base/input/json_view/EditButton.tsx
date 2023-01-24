/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {ChangeEvent, FC, useEffect, useRef, useState} from 'react';
import {withTheme} from 'styled-components';
import {isJsonString, setFocusById} from "@application/utils/utils";
import {ColorTheme} from "@style/Theme";
import {EditButtonProps} from "../../input/json_view/interfaces";
import Button from "../../button/Button";
import {TextSize} from "../../text/interfaces";
import Dialog from "../../dialog/Dialog";
import InputTextarea from "../../input/textarea/InputTextarea";

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
            setValidationMessage('')
            editJson(JSON.parse(newJson));
            toggle();
        } else{
            setValidationMessage('This is not a valid Json input.')
        }
    }
    useEffect(() => {
        if(showDialog){
            setNewJson(JSON.stringify(jsonValue));
            setFocusById('input_json');
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
                color={ColorTheme.Blue}
            />
            <Dialog
                actions={actions}
                active={showDialog}
                toggle={toggle}
                title={'Edit Json'}
                styles={{modal: {minWidth: '60%'}, body: {minHeight: '400px'}}}
            >
                <InputTextarea
                    rows={5}
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