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
import {setFocusById} from "@application/utils/utils";
import {ColorTheme} from "@style/Theme";
import {EditXmlButtonProps} from "./interfaces";
import Button from "../../button/Button";
import {TextSize} from "../../text/interfaces";
import Dialog from "../../dialog/Dialog";
import InputTextarea from "../../input/textarea/InputTextarea";
import CXmlEditor from "@app_component/base/input/xml_view/xml_editor/classes/CXmlEditor";

const EditXmlButton: FC<EditXmlButtonProps> =
    ({
        readOnly,
        xmlValue,
        editXml,
    }) => {
    const [newXml, setNewXml] = useState<string>(xmlValue);
    const [validationMessage, setValidationMessage] = useState<string>('');
    const [showDialog, toggleDialog] = useState<boolean>(false);
    const toggle = () => {
        toggleDialog(!showDialog);
    }
    const edit = () => {
        const domParser = new DOMParser();
        const dom = domParser.parseFromString(newXml, 'text/xml');
        if(dom.documentElement.nodeName !== 'parsererror'){
            setValidationMessage('')
            editXml(CXmlEditor.createXmlEditor(newXml));
            toggle();
        } else{
            setValidationMessage('This is not a valid xml input.')
        }
    }
    useEffect(() => {
        if(showDialog){
            setNewXml(xmlValue);
            setFocusById('input_xml');
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
                title={'Edit Xml'}
                styles={{modal: {minWidth: '60%'}, body: {minHeight: '400px'}}}
            >
                <InputTextarea
                    rows={5}
                    id={`input_xml`}
                    label={'Xml'}
                    readOnly={readOnly}
                    icon={'data_object'}
                    error={validationMessage}
                    onChange={(e) => setNewXml(e.target.value)}
                    value={newXml}
                />
            </Dialog>
        </React.Fragment>
    )
}

EditXmlButton.defaultProps = {
}


export {
    EditXmlButton,
};

export default withTheme(EditXmlButton);